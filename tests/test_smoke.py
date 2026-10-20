import os

def test_production_build_and_cname():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    dist_dir = os.path.join(base_dir, "dist")
    cname_file = os.path.join(base_dir, "public", "CNAME")
    
    assert os.path.exists(cname_file), "public/CNAME must exist for GitHub Pages custom domain"
    assert os.path.exists(dist_dir), "dist/ output must exist for deployment"
