mod agent;
mod agents;
mod orchestrator;

use agents::{heartbeat::HeartbeatAgent, sentinel::SentinelAgent, vitals::VitalsAgent};
use axum::{
    extract::{Path, State},
    response::sse::{Event, Sse},
    routing::{get, post},
    Json, Router,
};
use futures::stream::Stream;
use orchestrator::Orchestrator;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::time::Duration;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    let agents: Vec<Box<dyn agent::Agent>> = vec![
        Box::new(VitalsAgent::new()),
        Box::new(HeartbeatAgent::new()),
        Box::new(SentinelAgent::new()),
    ];

    let orchestrator = Arc::new(Orchestrator::new(agents));

    let tick_handle = orchestrator.clone();
    tokio::spawn(async move {
        tick_handle.run(Duration::from_secs(2)).await;
    });

    let app = Router::new()
        .route("/api/status", get(status_handler))
        .route("/api/stream", get(stream_handler))
        .route("/api/agents/:id/toggle", post(toggle_handler))
        .nest_service("/", ServeDir::new("../web"))
        .layer(CorsLayer::permissive())
        .with_state(orchestrator);

    let addr = SocketAddr::from(([0, 0, 0, 0], 7878));
    println!("Hangar orchestrator online at http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn status_handler(State(orch): State<Arc<Orchestrator>>) -> Json<Vec<agent::AgentReport>> {
    Json(orch.snapshot.read().await.clone())
}

async fn toggle_handler(
    State(orch): State<Arc<Orchestrator>>,
    Path(id): Path<String>,
) -> Json<serde_json::Value> {
    match orch.toggle(&id).await {
        Some(now_enabled) => Json(serde_json::json!({ "id": id, "enabled": now_enabled })),
        None => Json(serde_json::json!({ "error": "unknown agent" })),
    }
}

async fn stream_handler(
    State(orch): State<Arc<Orchestrator>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = orch.tx.subscribe();
    let stream = BroadcastStream::new(rx).filter_map(|msg| match msg {
        Ok(reports) => {
            let data = serde_json::to_string(&reports).unwrap_or_default();
            Some(Ok(Event::default().data(data)))
        }
        Err(_) => None,
    });
    Sse::new(stream)
}
