import * as Cannon from "cannon";
import * as THREE from "three";
import { PhysicBox, PhysicPlane, PhysicSphere } from "./PhysicObject";
import { PhysicUnit, Unit } from "./Unit";

class Room {
    public units: Unit[];
    public scene: THREE.Scene;
    public camera: THREE.Camera;
    public scene2d: THREE.Scene;
    public camera2d: THREE.Camera;

    public physicWorld: Cannon.World;

    public frame: number;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene2d = new THREE.Scene();
        this.camera2d = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, 0.0001, 10000);
        this.units = [];
        this.frame = 0;
        this.physicWorld = new Cannon.World();
        this.physicWorld.gravity.set(0, -9.82, 0);
        this.physicWorld.broadphase = new Cannon.NaiveBroadphase();
        this.physicWorld.solver.iterations = 5;
    }

    public Update(): void {
        this.frame++;
        // 有効でなくなったUnitの削除処理を行ってからUpdate()を実行する
        this.Remove();
        this.units.forEach((u) => {
            u.Update();
        });
        this.physicWorld.step(1 / 60);
    }

    public Draw(): void {
        this.units.forEach((u) => {
            u.Draw();
        });
    }

    public Init(): void {
        this.units.forEach((u) => {
            u.Init();
        });
    }

    public AddUnit(u: Unit): void {
        // Initを実行してからリストに追加
        u.room = this;
        u.Init();
        this.units.push(u);
    }

    public LoadFromFile(filename: string): void {
        const loader = new THREE.FileLoader();
        loader.load(filename, (res) => {
            const objs = JSON.parse(res);
            // 各unit
            objs.forEach((obj) => {
                const u: Unit = new PhysicUnit();
                if ("name" in obj) {
                    console.log(obj.name);
                }
                if ("phys" in obj) {
                    // 各物理オブジェクト
                    obj.phys.forEach((physic) => {
                        if ("name" in physic) {
                            console.log(physic.name);
                        }
                        switch (physic.type) {
                            case "sphere": {
                                console.log("sp");
                                const x: number = physic.x;
                                const y: number = physic.y;
                                const z: number = physic.z;
                                const mass: number = physic.mass;
                                const radius: number = physic.radius;
                                const sphere = new PhysicSphere(mass, radius);
                                sphere.PhyBody.position.set(x, y, z);
                                break;
                            }
                            case "box": {
                                console.log("box");
                                const x: number = physic.x;
                                const y: number = physic.y;
                                const z: number = physic.z;
                                const mass: number = physic.mass;
                                const width: number = physic.width;
                                const height: number = physic.height;
                                const depth: number = physic.depth;
                                const box = new PhysicBox(mass, width, height, depth);
                                box.PhyBody.position.set(x, y, z);
                                break;
                            }
                            default:
                                break;
                        }
                    });
                }
            });
        });
    }

    public Remove(): void {
        // 有効でなくなったUnitに紐づけられてるObject3Dを削除し、PhysicObjectも削除し、Fin()を呼び出す
        this.units.filter((u) => !u.isAlive).forEach((u) => {
            u.objects.forEach((o) => { this.scene.remove(o); });
            u.physicObjects.forEach((p) => {
                this.scene.remove(p.viewBody);
                this.physicWorld.remove(p.PhyBody);
            });
            u.Fin();
        });
        // Unitのリストから有効でなくなったものを取り除く
        this.units = this.units.filter((u) => u.isAlive);
    }
}

export { Room };
