use crate::frame::{FrameType, JasonFrame};
use crate::mesh::MeshBus;
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::SocketAddr, sync::Arc, time::Instant};
use tokio::net::TcpListener;

#[derive(Clone)]
pub struct AppState {
    pub mesh: MeshBus,
    pub routes: Arc<RoutingTable>,
    pub start_time: Instant,
}

#[derive(Debug, Clone, Default)]
pub struct RoutingTable {
    pub voip: HashMap<String, String>,
    pub radio: HashMap<String, String>,
    pub voice: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct IncomingJsonFrame {
    frame_type: String,
    #[serde(default)]
    payload: serde_json::Value,
    #[serde(default)]
    payload_raw: Option<Vec<u8>>,
    /// Optional routing key looked up in the AppState RoutingTable for
    /// voip/radio/voice frames (e.g. a device or peer id).
    #[serde(default)]
    target: Option<String>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    service: &'static str,
    version: &'static str,
    uptime_secs: u64,
    mesh_queue_len: usize,
    frame_types: Vec<&'static str>,
}

#[derive(Serialize)]
struct FrameAck {
    accepted: bool,
    frame_type: String,
    timestamp: u64,
    payload_len: u32,
    routed_to: String,
}

/// Looks up `target` in `table`, if given. Falls back to `category` when
/// there's no target or no matching entry.
fn resolve_route(table: &HashMap<String, String>, category: &str, target: Option<&str>) -> String {
    match target.and_then(|t| table.get(t)) {
        Some(dest) => dest.clone(),
        None => category.to_string(),
    }
}

async fn handle_frame(
    State(state): State<AppState>,
    Json(body): Json<IncomingJsonFrame>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // Parse frame type flexibly
    let frame_type: FrameType = body.frame_type.parse().map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error": format!("unknown frame_type {}", body.frame_type)})),
        )
    })?;

    // Build payload bytes: prefer payload_raw if given, else serialize payload Value
    let payload_bytes: Vec<u8> = if let Some(raw) = body.payload_raw {
        raw
    } else {
        match &body.payload {
            serde_json::Value::Null => vec![],
            _ => serde_json::to_vec(&body.payload).unwrap_or_default(),
        }
    };

    let frame = JasonFrame::new(frame_type, payload_bytes);

    // Route logic: for voip/radio/voice, consult the RoutingTable if a target
    // key was given, so entries registered there actually affect routing
    // rather than sitting unused.
    let routed_to: String = match frame_type {
        FrameType::VoipFrame => resolve_route(&state.routes.voip, "voip", body.target.as_deref()),
        FrameType::RadioFrame => resolve_route(&state.routes.radio, "radio", body.target.as_deref()),
        FrameType::VoiceFrame => resolve_route(&state.routes.voice, "voice", body.target.as_deref()),
        FrameType::MeshGossip | FrameType::EvolutionEvent => {
            // Push to mesh bus (future ZMQ)
            if let Err(e) = state.mesh.send_gossip(frame.clone()) {
                tracing::error!("mesh send failed: {}", e);
            }
            "mesh".to_string()
        }
        FrameType::HealthReport => "health".to_string(),
    };

    tracing::info!(
        frame_type = %frame.frame_type,
        payload_len = frame.payload_len,
        routed_to = %routed_to,
        "frame accepted"
    );

    let ack = FrameAck {
        accepted: true,
        frame_type: frame.frame_type.to_string(),
        timestamp: frame.timestamp,
        payload_len: frame.payload_len,
        routed_to,
    };

    Ok((StatusCode::ACCEPTED, Json(ack)))
}

async fn handle_frame_binary(
    State(state): State<AppState>,
    body: axum::body::Bytes,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let frame = JasonFrame::decode_binary(&body).map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
    
    if frame.frame_type == FrameType::MeshGossip {
        let _ = state.mesh.send_gossip(frame.clone());
    }

    tracing::info!(frame_type = %frame.frame_type, len = frame.payload_len, "binary frame accepted");
    Ok((StatusCode::ACCEPTED, format!("OK {}\n", frame.frame_type)))
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        service: "jasoncomms-core",
        version: env!("CARGO_PKG_VERSION"),
        uptime_secs: state.start_time.elapsed().as_secs(),
        mesh_queue_len: state.mesh.len(),
        frame_types: vec!["VOIP_FRAME","RADIO_FRAME","VOICE_FRAME","MESH_GOSSIP","HEALTH_REPORT","EVOLUTION_EVENT"],
    })
}

async fn mesh_peek(State(state): State<AppState>) -> Json<Vec<JasonFrame>> {
    Json(state.mesh.peek_all())
}

pub fn build_app(state: AppState) -> Router {
    Router::new()
        .route("/frame", post(handle_frame))
        .route("/frame/binary", post(handle_frame_binary))
        .route("/health", get(health))
        .route("/mesh", get(mesh_peek))
        .with_state(state)
}

pub fn default_state() -> AppState {
    AppState {
        mesh: MeshBus::new(2048),
        routes: Arc::new(RoutingTable::default()),
        start_time: Instant::now(),
    }
}

pub async fn run() -> anyhow::Result<()> {
    let app = build_app(default_state());

    let addr = SocketAddr::from(([0, 0, 0, 0], 8088));
    tracing::info!("JasonComms listening on {}", addr);
    tracing::info!("Endpoints: POST /frame (json), POST /frame/binary, GET /health, GET /mesh");

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum_test::TestServer;

    fn test_app() -> TestServer {
        TestServer::new(build_app(default_state())).unwrap()
    }

    #[tokio::test]
    async fn health_reports_ok() {
        let server = test_app();
        let res = server.get("/health").await;
        res.assert_status_ok();
        let body: serde_json::Value = res.json();
        assert_eq!(body["status"], "ok");
        assert_eq!(body["service"], "jasoncomms-core");
        assert_eq!(body["mesh_queue_len"], 0);
    }

    #[tokio::test]
    async fn json_frame_without_target_falls_back_to_category() {
        let server = test_app();
        let res = server
            .post("/frame")
            .json(&serde_json::json!({"frame_type": "VOIP_FRAME", "payload": {"hello": "world"}}))
            .await;
        res.assert_status(StatusCode::ACCEPTED);
        let body: serde_json::Value = res.json();
        assert_eq!(body["routed_to"], "voip");
        assert_eq!(body["accepted"], true);
    }

    #[tokio::test]
    async fn json_frame_with_target_resolves_via_routing_table() {
        let mut routes = RoutingTable::default();
        routes.voip.insert("alice".to_string(), "gateway-3".to_string());
        let state = AppState {
            mesh: MeshBus::new(64),
            routes: Arc::new(routes),
            start_time: Instant::now(),
        };
        let server = TestServer::new(build_app(state)).unwrap();

        let res = server
            .post("/frame")
            .json(&serde_json::json!({"frame_type": "VOIP_FRAME", "target": "alice"}))
            .await;
        res.assert_status(StatusCode::ACCEPTED);
        let body: serde_json::Value = res.json();
        assert_eq!(body["routed_to"], "gateway-3");
    }

    #[tokio::test]
    async fn unknown_frame_type_is_rejected() {
        let server = test_app();
        let res = server
            .post("/frame")
            .json(&serde_json::json!({"frame_type": "NOT_A_REAL_TYPE"}))
            .await;
        res.assert_status(StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn mesh_gossip_frames_show_up_in_mesh_peek() {
        let server = test_app();
        let post_res = server
            .post("/frame")
            .json(&serde_json::json!({"frame_type": "MESH_GOSSIP", "payload": {"n": 1}}))
            .await;
        post_res.assert_status(StatusCode::ACCEPTED);

        let peek_res = server.get("/mesh").await;
        peek_res.assert_status_ok();
        let frames: Vec<serde_json::Value> = peek_res.json();
        assert_eq!(frames.len(), 1);
    }

    #[tokio::test]
    async fn resolve_route_falls_back_when_target_missing() {
        let table = HashMap::new();
        assert_eq!(resolve_route(&table, "voip", Some("nobody")), "voip");
        assert_eq!(resolve_route(&table, "voip", None), "voip");
    }

    #[tokio::test]
    async fn resolve_route_uses_table_entry_when_present() {
        let mut table = HashMap::new();
        table.insert("bob".to_string(), "peer-7".to_string());
        assert_eq!(resolve_route(&table, "voip", Some("bob")), "peer-7");
    }
}
