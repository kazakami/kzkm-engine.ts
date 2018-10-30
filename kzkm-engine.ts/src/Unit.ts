import * as THREE from "three";
import { Core } from "./Core";
import { PhysicObject } from "./PhysicObject";
import { Scene } from "./Scene";

/**
 * Unitの基底クラス、これを継承して用いる
 * 基本的にコンストラクタは用いず、Init()に起動時の処理を追加する
 * Update()関数をオーバーライドした際はsuper.Updateを実行しないとframeおよび物理オブジェクトの更新が行われない
 */
abstract class Unit {
    public isAlive: boolean = true;
    public priority: number = 0;
    public core: Core = null;
    public scene: Scene = null;
    public frame: number = 0;
    public objects: THREE.Object3D[] = [];
    public physicObjects: PhysicObject[] = [];
    constructor() {
        return;
    }
    public Update(): void {
        this.frame++;
        this.physicObjects.forEach((p) => { p.Update(); });
    }
    public Draw(): void { return; }
    public abstract Init(): void;
    public abstract Fin(): void;
    /**
     * sceneにObject3Dを追加し、Unitに紐づける
     * 追加されたObject3DはこのUnitの削除時に自動でシーンから除外される
     * @param o 追加するObject3D
     */
    public AddObject(o: THREE.Object3D): void {
        this.objects.push(o);
        this.scene.scene.add(o);
    }
    /**
     * sceneにviewBodyを追加し、physicWorldにphysicBodyを追加し、オブジェクトをUnitに紐付ける
     * 追加された物理オブジェクトはこのUnitの削除時に自動でシーンから除外される
     * @param p 追加する物理オブジェクト
     */
    public AddPhysicObject(p: PhysicObject): void {
        this.physicObjects.push(p);
        this.scene.physicWorld.addBody(p.phyBody);
        this.scene.scene.add(p.viewBody);
    }
    /**
     * 指定したObject3Dを削除
     * @param o 削除するObject3D
     */
    public RemoveObject(o: THREE.Object3D): void {
        this.objects = this.objects.filter((obj) => o !== obj);
        this.scene.scene.remove(o);
    }
    /**
     * 指定した物理オブジェクトを削除する
     * @param p 削除する物理オブジェクト
     */
    public RemovePhysicOnject(p: PhysicObject): void {
        this.physicObjects = this.physicObjects.filter((pobj) => p !== pobj);
        this.scene.physicWorld.remove(p.phyBody);
        this.scene.scene.remove(p.viewBody);
    }
}

class PhysicUnit extends Unit {
    public Init() {
        return;
    }
    public Update() {
        super.Update();
    }
    public Fin() {
        return;
    }
}

export { Unit, PhysicUnit };
