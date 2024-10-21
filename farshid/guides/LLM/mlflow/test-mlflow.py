from mlflow import log_metric, log_param, log_artifact
if __name__ == "__main__":
    log_param("param1", 5)
    log_metric("foo", 7)
    log_metric("foo", 1)
    log_metric("foo", 2)
    
    log_artifact("/Users/farshid/farshid/pirahansiah.github.io/site/pages/md/DL.md")
# mlflow ui
