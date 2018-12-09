import * as THREE from "three";
import { Scene, Start, Terrain, Unit } from "../src/nene-engine";

class LoadScene extends Scene {
    public Init() {
        this.core.LoadTexture("resources/images/grass.png", "grass");
    }
    public Update(): void {
        if (this.core.IsAllResourcesAvailable()) {
            // オブジェクトenteが読み込まれればシーン遷移
            this.core.AddAndChangeScene("game", new GameScene());
        }
    }
    public DrawText(): void {
        const [a, b] = this.core.GetAllResourcesLoadingProgress();
        this.core.DrawText("Now Loading " + a + "/" + b, 0, 0);
    }
}

class GameScene extends Scene {
    private t: Terrain;
    public Init() {
        this.onWindowResize = () => {
            this.core.ChangeCanvasSize(window.innerWidth, window.innerHeight);
        };
        this.backgroundColor = new THREE.Color(0.6, 0.8, 0.9);
        this.scene.fog = new THREE.Fog(new THREE.Color(0.6, 0.8, 0.9).getHex(), 1, 3000);
        this.t = new Terrain();
        this.t.MakeGeometry(50, 50, 10, 10, 5, 5);
        this.scene.add(this.t.GetObject());
        for (let i = 0; i < this.t.GetWidthAllSegments(); i++) {
            for (let j = 0; j < this.t.GetDepthAllSegments(); j++) {
                this.t.SetHeight(i, j, Math.random() * 2, false);
            }
        }
        this.t.ComputeNorm();
        // this.t.SetHeight(5, 5, 10, false);
        // this.t.ComputeNorm();
        const light = new THREE.DirectionalLight("white", 1);
        light.position.set(50, 100, 50);
        this.scene.add(light);
        this.AddUnit(new Cameraman());
    }
}

class Cameraman extends Unit {
    private pos: THREE.Vector3;
    private rot: THREE.Quaternion;
    public Init(): void {
        this.pos = new THREE.Vector3(0, 20, 50);
        this.rot = new THREE.Quaternion(0, 0, 0, 1);
    }
    public Update(): void {
        const dir = new THREE.Vector3(0, 0, 1);
        dir.applyQuaternion(this.rot);
        this.scene.camera.position.copy(this.pos);
        this.scene.camera.up.set(0, 1, 0);
        this.scene.camera.lookAt(
            this.pos.x - dir.x,
            this.pos.y - dir.y,
            this.pos.z - dir.z);
    }
}

const c = Start("initScene", new LoadScene());
