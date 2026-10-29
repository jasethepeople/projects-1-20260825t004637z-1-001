use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Status {
    Nominal,
    Warn,
    Alert,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentReport {
    pub id: String,
    pub name: String,
    pub role: String,
    pub status: Status,
    pub message: String,
    pub metrics: HashMap<String, f64>,
    pub updated_at: DateTime<Utc>,
    pub enabled: bool,
}

/// Every unit of automation the cockpit displays implements this trait.
/// `tick` is called on a fixed interval by the orchestrator loop and
/// returns the agent's current read on the world.
#[async_trait]
pub trait Agent: Send + Sync {
    fn id(&self) -> &str;
    fn name(&self) -> &str;
    fn role(&self) -> &str;
    async fn tick(&mut self, enabled: bool) -> AgentReport;
}
