use crate::frame::{FrameType, JasonFrame};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use tracing::{info, warn};

/// In-memory gossip buffer. Future: ZeroMQ PUB/SUB.
#[derive(Clone, Debug)]
pub struct MeshBus {
    inner: Arc<Mutex<VecDeque<JasonFrame>>>,
    capacity: usize,
}

impl MeshBus {
    pub fn new(capacity: usize) -> Self {
        Self { inner: Arc::new(Mutex::new(VecDeque::with_capacity(capacity))), capacity }
    }

    /// Stub for future ZeroMQ send_gossip
    pub fn send_gossip(&self, frame: JasonFrame) -> Result<(), MeshError> {
        if frame.frame_type != FrameType::MeshGossip 
           && frame.frame_type != FrameType::EvolutionEvent
           && frame.frame_type != FrameType::HealthReport {
            warn!("send_gossip called with non-gossip type {:?}", frame.frame_type);
        }
        let mut q = self.inner.lock().unwrap();
        if q.len() >= self.capacity {
            warn!("mesh bus full (capacity {}), rejecting frame", self.capacity);
            return Err(MeshError::Full);
        }
        info!(frame_type = %frame.frame_type, len = frame.payload_len, "enqueued gossip");
        q.push_back(frame);
        Ok(())
    }

    /// Stub for future ZeroMQ receive_gossip
    pub fn receive_gossip(&self) -> Option<JasonFrame> {
        let mut q = self.inner.lock().unwrap();
        q.pop_front()
    }

    pub fn peek_all(&self) -> Vec<JasonFrame> {
        self.inner.lock().unwrap().iter().cloned().collect()
    }

    pub fn len(&self) -> usize {
        self.inner.lock().unwrap().len()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum MeshError {
    #[error("mesh bus full")]
    Full,
    /// Reserved for the future real transport (ZeroMQ); not yet constructed
    /// anywhere since there's no real connection to fail.
    #[allow(dead_code)]
    #[error("mesh transport not connected (stub)")]
    NotConnected,
}

impl Default for MeshBus {
    fn default() -> Self {
        Self::new(1024)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn gossip_frame(n: u8) -> JasonFrame {
        JasonFrame::new(FrameType::MeshGossip, vec![n])
    }

    #[test]
    fn send_and_receive_is_fifo() {
        let bus = MeshBus::new(4);
        bus.send_gossip(gossip_frame(1)).unwrap();
        bus.send_gossip(gossip_frame(2)).unwrap();
        assert_eq!(bus.len(), 2);
        assert_eq!(bus.receive_gossip().unwrap().payload, vec![1]);
        assert_eq!(bus.receive_gossip().unwrap().payload, vec![2]);
        assert!(bus.receive_gossip().is_none());
    }

    #[test]
    fn send_gossip_rejects_when_full_instead_of_dropping_oldest() {
        let bus = MeshBus::new(2);
        bus.send_gossip(gossip_frame(1)).unwrap();
        bus.send_gossip(gossip_frame(2)).unwrap();

        let err = bus.send_gossip(gossip_frame(3)).unwrap_err();
        assert!(matches!(err, MeshError::Full));

        // the oldest frame must still be there - nothing got silently evicted
        let all = bus.peek_all();
        assert_eq!(all.len(), 2);
        assert_eq!(all[0].payload, vec![1]);
        assert_eq!(all[1].payload, vec![2]);
    }

    #[test]
    fn peek_all_does_not_drain_the_queue() {
        let bus = MeshBus::new(4);
        bus.send_gossip(gossip_frame(9)).unwrap();
        assert_eq!(bus.peek_all().len(), 1);
        assert_eq!(bus.len(), 1); // still there after peek
    }
}
