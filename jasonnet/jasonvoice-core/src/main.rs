use axum::{routing::get, Router, Json};
use serde_json::json;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env().add_directive("info".parse().unwrap())).init();
    let app = Router::new().route("/health", get(|| async { Json(json!({"service":"jasonvoice-core","status":"ok"})) }));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8090").await.unwrap();
    tracing::info!("jasonvoice-core on :8090");
    axum::serve(listener, app).await.unwrap();
}
