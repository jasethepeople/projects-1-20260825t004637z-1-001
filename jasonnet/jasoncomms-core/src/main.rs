mod frame;
mod mesh;
mod router;

use tracing_subscriber::{fmt, EnvFilter};

#[tokio::main]
async fn main() {
    // Init tracing with env filter: RUST_LOG=info by default
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    fmt().with_env_filter(filter).init();

    if let Err(e) = router::run().await {
        tracing::error!(error = %e, "server crashed");
        std::process::exit(1);
    }
}
