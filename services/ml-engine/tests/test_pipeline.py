from app.main import run_pipeline

def test_pipeline_execution():
    result = run_pipeline()
    assert isinstance(result, dict)
    assert result["status"] == "ready"
