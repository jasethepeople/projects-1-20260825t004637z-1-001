use bytes::{Buf, BufMut, BytesMut};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub const MAGIC: [u8; 3] = *b"JSN";
pub const CURRENT_VERSION: u8 = 1;
pub const HEADER_SIZE: usize = 3 + 1 + 1 + 8 + 4; // magic + version + type + timestamp + len = 17

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FrameType {
    VoipFrame = 0x01,
    RadioFrame = 0x02,
    VoiceFrame = 0x03,
    MeshGossip = 0x04,
    HealthReport = 0x05,
    EvolutionEvent = 0x06,
}

impl FrameType {
    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            0x01 => Some(Self::VoipFrame),
            0x02 => Some(Self::RadioFrame),
            0x03 => Some(Self::VoiceFrame),
            0x04 => Some(Self::MeshGossip),
            0x05 => Some(Self::HealthReport),
            0x06 => Some(Self::EvolutionEvent),
            _ => None,
        }
    }

    pub fn as_u8(self) -> u8 {
        self as u8
    }

    pub fn as_str(self) -> &'static str {
        match self {
            Self::VoipFrame => "VOIP_FRAME",
            Self::RadioFrame => "RADIO_FRAME",
            Self::VoiceFrame => "VOICE_FRAME",
            Self::MeshGossip => "MESH_GOSSIP",
            Self::HealthReport => "HEALTH_REPORT",
            Self::EvolutionEvent => "EVOLUTION_EVENT",
        }
    }
}

impl std::fmt::Display for FrameType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

impl std::str::FromStr for FrameType {
    type Err = FrameError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_uppercase().as_str() {
            "VOIP" | "VOIP_FRAME" | "VOIPFRAME" => Ok(Self::VoipFrame),
            "RADIO" | "RADIO_FRAME" | "RADIOFRAME" => Ok(Self::RadioFrame),
            "VOICE" | "VOICE_FRAME" | "VOICEFRAME" => Ok(Self::VoiceFrame),
            "MESH" | "MESH_GOSSIP" | "MESHGOSSIP" | "GOSSIP" => Ok(Self::MeshGossip),
            "HEALTH" | "HEALTH_REPORT" | "HEALTHREPORT" => Ok(Self::HealthReport),
            "EVOLUTION" | "EVOLUTION_EVENT" | "EVOLUTIONEVENT" => Ok(Self::EvolutionEvent),
            _ => Err(FrameError::UnknownFrameType(s.to_string())),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct JasonFrame {
    pub magic: [u8; 3],
    pub version: u8,
    pub frame_type: FrameType,
    pub timestamp: u64,
    pub payload_len: u32,
    #[serde(with = "serde_bytes")]
    pub payload: Vec<u8>,
}

// Custom serde for magic as string "JSN" in JSON
mod serde_bytes {
    use super::*;
    use serde::{Deserializer, Serializer};

    pub fn serialize<S>(bytes: &[u8], s: S) -> Result<S::Ok, S::Error>
    where S: Serializer {
        s.serialize_bytes(bytes)
    }
    pub fn deserialize<'de, D>(d: D) -> Result<Vec<u8>, D::Error>
    where D: Deserializer<'de> {
        Vec::<u8>::deserialize(d)
    }
}

impl JasonFrame {
    pub fn new(frame_type: FrameType, payload: Vec<u8>) -> Self {
        let ts = Utc::now().timestamp_millis() as u64;
        let len = payload.len() as u32;
        Self {
            magic: MAGIC,
            version: CURRENT_VERSION,
            frame_type,
            timestamp: ts,
            payload_len: len,
            payload,
        }
    }

    pub fn with_timestamp(mut self, ts: u64) -> Self {
        self.timestamp = ts;
        self
    }

    /// Binary encode: | MAGIC(3) | VER(1) | TYPE(1) | TIMESTAMP(8 BE) | LEN(4 BE) | PAYLOAD |
    pub fn encode_binary(&self) -> Vec<u8> {
        let mut buf = BytesMut::with_capacity(HEADER_SIZE + self.payload.len());
        buf.put_slice(&self.magic);
        buf.put_u8(self.version);
        buf.put_u8(self.frame_type.as_u8());
        buf.put_u64(self.timestamp);
        buf.put_u32(self.payload_len);
        buf.put_slice(&self.payload);
        buf.freeze().to_vec()
    }

    pub fn decode_binary(mut data: &[u8]) -> Result<Self, FrameError> {
        if data.len() < HEADER_SIZE {
            return Err(FrameError::TooShort { expected: HEADER_SIZE, got: data.len() });
        }
        let mut magic = [0u8; 3];
        data.copy_to_slice(&mut magic);
        if magic != MAGIC {
            return Err(FrameError::BadMagic(magic));
        }
        let version = data.get_u8();
        if version != CURRENT_VERSION {
            return Err(FrameError::UnsupportedVersion(version));
        }
        let type_byte = data.get_u8();
        let frame_type = FrameType::from_u8(type_byte)
            .ok_or(FrameError::UnknownFrameTypeByte(type_byte))?;
        let timestamp = data.get_u64();
        let payload_len = data.get_u32();

        if data.remaining() < payload_len as usize {
            return Err(FrameError::PayloadTruncated { expected: payload_len as usize, got: data.remaining() });
        }
        let mut payload = vec![0u8; payload_len as usize];
        data.copy_to_slice(&mut payload);

        Ok(Self { magic, version, frame_type, timestamp, payload_len, payload })
    }

    pub fn to_json_bytes(&self) -> Result<Vec<u8>, FrameError> {
        serde_json::to_vec(self).map_err(FrameError::Json)
    }

    pub fn from_json_bytes(b: &[u8]) -> Result<Self, FrameError> {
        let mut frame: Self = serde_json::from_slice(b).map_err(FrameError::Json)?;
        // Recompute payload_len from actual payload to prevent spoofing
        frame.payload_len = frame.payload.len() as u32;
        frame.magic = MAGIC;
        Ok(frame)
    }
}

#[derive(Debug, Error)]
pub enum FrameError {
    #[error("buffer too short: expected {expected} got {got}")]
    TooShort { expected: usize, got: usize },
    #[error("bad magic: expected JSN got {0:?}")]
    BadMagic([u8; 3]),
    #[error("unsupported version {0}")]
    UnsupportedVersion(u8),
    #[error("unknown frame type string {0}")]
    UnknownFrameType(String),
    #[error("unknown frame type byte {0:#x}")]
    UnknownFrameTypeByte(u8),
    #[error("payload truncated expected {expected} got {got}")]
    PayloadTruncated { expected: usize, got: usize },
    #[error("json error {0}")]
    Json(#[from] serde_json::Error),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_binary() {
        let frame = JasonFrame::new(FrameType::VoipFrame, b"hello jason".to_vec());
        let enc = frame.encode_binary();
        let dec = JasonFrame::decode_binary(&enc).unwrap();
        assert_eq!(frame.frame_type, dec.frame_type);
        assert_eq!(frame.payload, dec.payload);
        assert_eq!(frame.magic, MAGIC);
    }

    #[test]
    fn roundtrip_json() {
        let frame = JasonFrame::new(FrameType::MeshGossip, vec![1,2,3,4]);
        let j = frame.to_json_bytes().unwrap();
        let dec = JasonFrame::from_json_bytes(&j).unwrap();
        assert_eq!(frame.frame_type, dec.frame_type);
        assert_eq!(frame.payload, dec.payload);
    }

    #[test]
    fn rejects_bad_magic() {
        let mut f = JasonFrame::new(FrameType::VoiceFrame, vec![]);
        f.magic = *b"BAD";
        let enc = f.encode_binary();
        assert!(matches!(JasonFrame::decode_binary(&enc), Err(FrameError::BadMagic(_))));
    }

    #[test]
    fn type_parse() {
        use std::str::FromStr;
        assert_eq!(FrameType::from_str("voip").unwrap(), FrameType::VoipFrame);
        assert_eq!(FrameType::from_str("MESH_GOSSIP").unwrap(), FrameType::MeshGossip);
    }

    #[test]
    fn with_timestamp_overrides_generated_value() {
        let frame = JasonFrame::new(FrameType::HealthReport, vec![]).with_timestamp(42);
        assert_eq!(frame.timestamp, 42);
    }
}
