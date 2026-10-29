use crate::agent::{Agent, AgentReport, Status};
use async_trait::async_trait;
use chrono::Utc;
use std::collections::HashMap;
use std::time::Instant;

pub struct HeartbeatAgent {
    started: Instant,
    ticks: u64,
}

impl HeartbeatAgent {
    pub fn new() -> Self {
        Self {
            started: Instant::now(),
            ticks: 0,
        }
    }
}

#[async_trait]
impl Agent for HeartbeatAgent {
    fn id(&self) -> &str {
        "heartbeat"
    }
    fn name(&self) -> &str {
        "Heartbeat"
    }
    fn role(&self) -> &str {
        "Confirms the orchestrator's reasoning loop is alive"
    }

    async fn tick(&mut self, enabled: bool) -> AgentReport {
        let mut metrics = HashMap::new();

        if !enabled {
            return AgentReport {
                id: self.id().into(),
                name: self.name().into(),
                role: self.role().into(),
                status: Status::Offline,
                message: "Paused.".into(),
                metrics,
                updated_at: Utc::now(),
                enabled,
            };
        }

        self.ticks += 1;
        let uptime = self.started.elapsed().as_secs();
        metrics.insert("uptime_s".into(), uptime as f64);
        metrics.insert("ticks".into(), self.ticks as f64);

        AgentReport {
            id: self.id().into(),
            name: self.name().into(),
            role: self.role().into(),
            status: Status::Nominal,
            message: format!("Tick #{} · up {}s", self.ticks, uptime),
            metrics,
            updated_at: Utc::now(),
            enabled,
        }
    }
}
