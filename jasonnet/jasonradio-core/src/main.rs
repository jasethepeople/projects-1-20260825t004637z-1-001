use axum::{routing::get, Router, Json};
use serde_json::json;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env().add_directive("info".parse().unwrap())).init();
    let app = Router::new().route("/health", get(|| async { Json(json!({"service":"jasonradio-core","status":"ok"})) }));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8089").await.unwrap();
    tracing::info!("jasonradio-core on :8089");
    axum::serve(listener, app).await.unwrap();
}
