use crate::agent::{Agent, AgentReport, Status};
use async_trait::async_trait;
use chrono::Utc;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// Stands in for a real watcher (logs, a queue, an inbox — whatever the
/// deployment needs). Wires up the same report shape every future watcher
/// agent will use, so swapping in a real data source later is a drop-in.
pub struct SentinelAgent {
    watch_target: String,
    events_seen: u64,
}

impl SentinelAgent {
    pub fn new() -> Self {
        Self {
            watch_target: "unassigned".into(),
            events_seen: 0,
        }
    }
}

#[async_trait]
impl Agent for SentinelAgent {
    fn id(&self) -> &str {
        "sentinel"
    }
    fn name(&self) -> &str {
        "Sentinel"
    }
    fn role(&self) -> &str {
        "Watches a feed for anomalies and flags what needs eyes"
    }

    async fn tick(&mut self, enabled: bool) -> AgentReport {
        let mut metrics = HashMap::new();

        if !enabled {
            return AgentReport {
                id: self.id().into(),
                name: self.name().into(),
                role: self.role().into(),
                status: Status::Offline,
                message: "Standing down.".into(),
                metrics,
                updated_at: Utc::now(),
                enabled,
            };
        }

        self.events_seen += 1;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        // Deterministic pseudo-variation so the cockpit has something to
        // react to before a real feed is wired in.
        let phase = now % 37;

        metrics.insert("events_seen".into(), self.events_seen as f64);

        let (status, message) = if phase == 0 {
            (
                Status::Alert,
                "No feed connected — nothing being watched.".to_string(),
            )
        } else if phase % 11 == 0 {
            (
                Status::Warn,
                format!("Watching '{}' — idle, awaiting a real source.", self.watch_target),
            )
        } else {
            (
                Status::Nominal,
                format!("{} events reviewed, no anomalies.", self.events_seen),
            )
        };

        AgentReport {
            id: self.id().into(),
            name: self.name().into(),
            role: self.role().into(),
            status,
            message,
            metrics,
            updated_at: Utc::now(),
            enabled,
        }
    }
}
