"""Convert the supplied Fusion OBJ exports into browser-friendly GLB files."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import trimesh


MODELS = {
    "robotarm": {
        "source": Path("assets/models/robotarm/robotarm.obj"),
        "target": Path("assets/models/robotarm/robotarm-web.glb"),
        "max_faces": 120_000,
    },
    "mecanum": {
        "source": Path("assets/models/mecanum/mecanum.obj"),
        "target": Path("assets/models/mecanum/mecanum-web.glb"),
        "max_faces": 180_000,
    },
}


def convert_model(project_root: Path, model_name: str) -> None:
    config = MODELS[model_name]
    source = project_root / config["source"]
    target = project_root / config["target"]
    if not source.exists():
        raise FileNotFoundError(f"OBJ 파일을 찾을 수 없습니다: {source}")

    print(f"[{model_name}] OBJ 읽는 중: {source}")
    scene = trimesh.load(
        source,
        force="scene",
        process=False,
        maintain_order=True,
    )
    mesh = scene.to_mesh()
    if mesh.is_empty:
        raise RuntimeError(f"{model_name} 모델에 표시할 메시가 없습니다.")

    mesh.remove_unreferenced_vertices()
    source_faces = len(mesh.faces)
    max_faces = int(config["max_faces"])
    if source_faces > max_faces:
        print(f"[{model_name}] {source_faces:,}면 → {max_faces:,}면 경량화 중")
        mesh = mesh.simplify_quadric_decimation(
            face_count=max_faces,
            aggression=7,
        )

    mesh.remove_unreferenced_vertices()
    mesh.apply_translation(-mesh.bounding_box.centroid)
    scale = float(np.max(mesh.extents))
    if scale > 0:
        mesh.apply_scale(2.0 / scale)

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(trimesh.exchange.gltf.export_glb(mesh))
    print(
        f"[{model_name}] 완료: {len(mesh.vertices):,} vertices / "
        f"{len(mesh.faces):,} faces / {target.stat().st_size / 1024 / 1024:.2f}MB"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "models",
        nargs="*",
        choices=sorted(MODELS),
        default=None,
    )
    args = parser.parse_args()
    project_root = Path(__file__).resolve().parents[1]
    for model_name in args.models or sorted(MODELS):
        convert_model(project_root, model_name)


if __name__ == "__main__":
    main()
