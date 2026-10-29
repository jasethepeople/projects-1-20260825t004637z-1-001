use crate::agent::{Agent, AgentReport, Status};
use async_trait::async_trait;
use chrono::Utc;
use std::collections::HashMap;
use sysinfo::System;

pub struct VitalsAgent {
    sys: System,
}

impl VitalsAgent {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self { sys }
    }
}

#[async_trait]
impl Agent for VitalsAgent {
    fn id(&self) -> &str {
        "vitals"
    }
    fn name(&self) -> &str {
        "Vitals"
    }
    fn role(&self) -> &str {
        "Watches host CPU, memory, and disk load"
    }

    async fn tick(&mut self, enabled: bool) -> AgentReport {
        let mut metrics = HashMap::new();

        if !enabled {
            return AgentReport {
                id: self.id().into(),
                name: self.name().into(),
                role: self.role().into(),
                status: Status::Offline,
                message: "Standing down. Re-arm to resume monitoring.".into(),
                metrics,
                updated_at: Utc::now(),
                enabled,
            };
        }

        self.sys.refresh_cpu();
        self.sys.refresh_memory();

        let cpu = self.sys.global_cpu_info().cpu_usage() as f64;
        let mem_used = self.sys.used_memory() as f64;
        let mem_total = self.sys.total_memory().max(1) as f64;
        let mem_pct = (mem_used / mem_total) * 100.0;

        metrics.insert("cpu_pct".into(), (cpu * 10.0).round() / 10.0);
        metrics.insert("mem_pct".into(), (mem_pct * 10.0).round() / 10.0);

        let (status, message) = if cpu > 90.0 || mem_pct > 90.0 {
            (Status::Alert, "Host under heavy load.".to_string())
        } else if cpu > 70.0 || mem_pct > 75.0 {
            (Status::Warn, "Load climbing, worth a look.".to_string())
        } else {
            (
                Status::Nominal,
                format!("CPU {:.0}% · Memory {:.0}%", cpu, mem_pct),
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
