from fastapi import APIRouter

router = APIRouter(tags=["Evaluation Benchmark"])

def get_eval_engine():
    from main import eval_engine
    return eval_engine

@router.get("/evaluation")
def run_evaluation():
    eval_engine = get_eval_engine()
    return eval_engine.run_all_benchmarks()
