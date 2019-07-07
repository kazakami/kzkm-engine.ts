import * as THREE from "three";
import { Figure } from "./Collider2D";
import { Core } from "./Core";
import { Particles } from "./Particles";
import { PhysicObject } from "./PhysicObject";
import { Scene } from "./Scene";
import { TiledTexturedSprite } from "./TiledTexturedSprite";

/**
 * Unitの基底クラス、これを継承して用いる
 * 基本的にコンストラクタ値の受け渡しにのみ用い、Init()に起動時の処理を追加する
 */
export abstract class Unit {
    /** このUnitが有効かどうか示す。falseにであった場合、次のsceneのUpdate()の呼ばれたときにsceneから除外される。 */
    public isAlive: boolean = true;
    /** Update()の呼ばれる優先度。未実装。 */
    public priority: number = 0;
    /** ゲームエンジンのコアへの参照。 */
    public core: Core = null;
    /** 所属するシーンへの参照。 */
    public scene: Scene = null;
    /** Update()の呼ばれた回数。 */
    public frame: number = 0;
    /** このUnitに紐づけられているすべての3Dオブジェクト。 */
    public allObject3D: THREE.Object3D[] = [];
    /** 物理オブジェクトの描画用のオブジェクトを除くこのUnitに紐づけられているすべての立体オブジェクト。 */
    public objects: THREE.Object3D[] = [];
    /** このUnitに紐づけられているすべてのParticles */
    public allParticles: Particles[] = [];
    /** このUnitに紐づけられているすべてのスプライト。 */
    public sprites: Array<THREE.Object3D | TiledTexturedSprite | Figure> = [];
    /** このUnitに紐づけられているすべての物理オブジェクト。 */
    public physicObjects: PhysicObject[] = [];
    /** このUnitに紐づけられているすべての2次元当たり判定用の図形。 */
    public colliders: Figure[] = [];
    /** このUnitがSceneのRaycast関数のターゲットになるか。 */
    public raycastTarget: boolean = false;
    /** unitインスタンスを識別するためのID */
    public id: string = "";
    /**
     * raycastされた際に呼ばれるコールバック関数
     * raycastTargetがtrueに成ってないと対象にならないことに注意
     * messageはScene.Raycastを呼ぶときに付加するメッセージ
     */
    public onRaycastedCallback: (intersections: THREE.Intersection[], message: object) => void = null;
    constructor() { return; }
    /**
     * この関数は基本的にオーバーライドすべきでない
     */
    public InnerUpdate(): void {
        this.frame++;
        this.physicObjects.forEach((p) => { p.Update(); });
        this.allParticles.forEach((p) => p.Update());
    }
    /**
     * この関数をオーバーライドし更新時の処理を記述する
     */
    public Update(): void { return; }
    /**
     * この関数をオーバーライドし文字列描画時の処理を記述する
     */
    public DrawText(): void { return; }
    /**
     * この関数をオーバーライドし初期化時の処理を記述する
     */
    public Init(): void { return; }
    /**
     * この関数をオーバーライドし削除時の処理を記述する
     */
    public Fin(): void { return; }
    /**
     * sceneにObject3Dを追加し、Unitに紐づける
     * 追加されたObject3DはこのUnitの削除時に自動でシーンから除外される
     * @param o 追加するObject3D
     */
    public AddObject(o: THREE.Object3D): void {
        this.allObject3D.push(o);
        this.objects.push(o);
        this.scene.scene.add(o);
    }
    /**
     * scene2dにObject3Dを追加し、Unitに紐づける
     * 追加されたObject3DはこのUnitの削除時に自動でシーンから除外される
     * @param o 追加するObject3D
     */
    public AddSprite(o: THREE.Object3D | TiledTexturedSprite | Figure): void {
        this.sprites.push(o);
        if ("isTiledTexturedSprite" in o) {
            this.scene.scene2d.add(o.sprite);
        } else if (o instanceof Figure) {
            if (!o.helper) {
                o.GenerateHelper();
            }
            this.scene.scene2d.add(o.helper);
        } else {
            this.scene.scene2d.add(o);
        }
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
        this.allObject3D.push(p.viewBody);
    }
    /**
     * sceneに当たり判定用の図形を登録し、このUnitに紐づける
     * 追加された図形はこのUnitの削除時に自動でシーンから除外される
     * 追加された図形は毎フレーム当たり判定が行われ、当たっているとonCollideCallbackが呼ばれる
     * @param f 追加する当たり判定用の図形
     */
    public AddCollider(f: Figure): void {
        this.colliders.push(f);
        this.scene.colliders.push(f);
    }
    /**
     * 指定したObject3Dをsceneから削除
     * @param o 削除するObject3D
     */
    public RemoveObject(o: THREE.Object3D): void {
        this.objects = this.objects.filter((obj) => o !== obj);
        this.allObject3D = this.allObject3D.filter((obj) => o !== obj);
        this.scene.scene.remove(o);
    }
    /**
     * 指定したObjectをscene2dから削除
     * @param o 削除するObject3D
     */
    public RemoveSprite(o: THREE.Object3D | TiledTexturedSprite | Figure): void {
        this.sprites = this.sprites.filter((spr) => o !== spr);
        if ("isTiledTexturedSprite" in o) {
            this.scene.scene2d.remove(o.sprite);
            o.Dispose();
        } else if (o instanceof Figure) {
            if (o.helper) {
                this.scene.scene2d.remove(o.helper);
            }
        } else {
            this.scene.scene2d.remove(o);
        }
    }
    /**
     * 指定した物理オブジェクトを削除する
     * @param p 削除する物理オブジェクト
     */
    public RemovePhysicObject(p: PhysicObject): void {
        this.physicObjects = this.physicObjects.filter((pobj) => p !== pobj);
        this.allObject3D = this.allObject3D.filter((obj) => obj !== p.viewBody);
        this.scene.physicWorld.remove(p.phyBody);
        this.scene.scene.remove(p.viewBody);
    }
    /**
     * 指定した当たり判定用の図形を削除する
     * @param f 削除する当たり判定用の図形
     */
    public RemoveCollider(f: Figure): void {
        this.colliders = this.colliders.filter((fig) => f !== fig);
        this.scene.colliders = this.scene.colliders.filter((fig) => f !== fig);
    }

    public AddParticle(p: Particles): void {
        this.allParticles.push(p);
        this.scene.scene.add(p.particle);
    }
    public RemoveParticle(p: Particles): void {
        p.Fin();
        this.allParticles = this.allParticles.filter((par) => p !== par);
        this.scene.scene.remove(p.particle);
    }
}

export class PhysicUnit extends Unit {
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
