use crate::agent::{Agent, AgentReport};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use tokio::time::{interval, Duration};

pub struct Orchestrator {
    agents: Arc<RwLock<Vec<Box<dyn Agent>>>>,
    enabled: Arc<RwLock<HashMap<String, bool>>>,
    pub snapshot: Arc<RwLock<Vec<AgentReport>>>,
    pub tx: broadcast::Sender<Vec<AgentReport>>,
}

impl Orchestrator {
    pub fn new(agents: Vec<Box<dyn Agent>>) -> Self {
        let mut enabled = HashMap::new();
        for a in &agents {
            enabled.insert(a.id().to_string(), true);
        }
        let (tx, _rx) = broadcast::channel(32);
        Self {
            agents: Arc::new(RwLock::new(agents)),
            enabled: Arc::new(RwLock::new(enabled)),
            snapshot: Arc::new(RwLock::new(Vec::new())),
            tx,
        }
    }

    pub async fn toggle(&self, id: &str) -> Option<bool> {
        let mut enabled = self.enabled.write().await;
        if let Some(v) = enabled.get_mut(id) {
            *v = !*v;
            Some(*v)
        } else {
            None
        }
    }

    /// Runs forever, ticking every agent on the given interval and
    /// publishing the resulting snapshot to both the shared state
    /// (for polling clients) and the broadcast channel (for SSE).
    pub async fn run(self: Arc<Self>, period: Duration) {
        let mut ticker = interval(period);
        loop {
            ticker.tick().await;

            let enabled_map = self.enabled.read().await.clone();
            let mut agents = self.agents.write().await;
            let mut reports = Vec::with_capacity(agents.len());

            for agent in agents.iter_mut() {
                let is_enabled = *enabled_map.get(agent.id()).unwrap_or(&true);
                reports.push(agent.tick(is_enabled).await);
            }
            drop(agents);

            *self.snapshot.write().await = reports.clone();
            let _ = self.tx.send(reports);
        }
    }
}
