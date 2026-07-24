"""Convert supplied Fusion OBJ exports into compact, material-preserving GLB files."""

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


def material_for_web(mesh: trimesh.Trimesh, fallback_name: str):
    """Return a simple PBR material using the diffuse color stored in the MTL."""
    source = getattr(mesh.visual, "material", None)
    diffuse = np.asarray(getattr(source, "diffuse", [190, 196, 207, 255]), dtype=float)
    if diffuse.size == 3:
        diffuse = np.append(diffuse, 255)
    diffuse = np.clip(diffuse, 0, 255).astype(np.uint8)
    return trimesh.visual.material.PBRMaterial(
        name=getattr(source, "name", fallback_name),
        baseColorFactor=diffuse,
        metallicFactor=0.05,
        roughnessFactor=0.72,
    )


def convert_model(project_root: Path, model_name: str) -> None:
    config = MODELS[model_name]
    source = project_root / config["source"]
    target = project_root / config["target"]
    if not source.exists():
        raise FileNotFoundError(f"OBJ file not found: {source}")

    print(f"[{model_name}] Loading {source}")
    scene = trimesh.load(source, force="scene", process=False, maintain_order=True)
    if not scene.geometry:
        raise RuntimeError(f"{model_name} has no displayable mesh.")

    source_faces = sum(len(mesh.faces) for mesh in scene.geometry.values())
    max_faces = int(config["max_faces"])
    ratio = min(1.0, max_faces / max(source_faces, 1))
    optimized = {}

    for name, original in scene.geometry.items():
        mesh = original.copy()
        mesh.remove_unreferenced_vertices()
        material = material_for_web(original, name)

        if ratio < 1 and len(mesh.faces) > 24:
            target_faces = max(24, int(len(mesh.faces) * ratio))
            mesh = mesh.simplify_quadric_decimation(
                face_count=min(target_faces, len(mesh.faces)),
                aggression=7,
            )

        mesh.remove_unreferenced_vertices()
        mesh.visual = trimesh.visual.TextureVisuals(material=material)
        optimized[name] = mesh

    for name, mesh in optimized.items():
        scene.geometry[name] = mesh

    center = scene.bounding_box.centroid
    scene.apply_translation(-center)
    scale = float(np.max(scene.extents))
    if scale > 0:
        scene.apply_scale(2.0 / scale)

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(trimesh.exchange.gltf.export_glb(scene))
    result_faces = sum(len(mesh.faces) for mesh in scene.geometry.values())
    print(
        f"[{model_name}] Complete: {len(scene.geometry)} materials / "
        f"{result_faces:,} faces / {target.stat().st_size / 1024 / 1024:.2f}MB"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("models", nargs="*", choices=sorted(MODELS), default=None)
    args = parser.parse_args()
    project_root = Path(__file__).resolve().parents[1]
    for model_name in args.models or sorted(MODELS):
        convert_model(project_root, model_name)


if __name__ == "__main__":
    main()
