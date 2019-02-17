import * as Cannon from "cannon";
import * as THREE from "three";
import { collide, Figure } from "./Collider2D";
import { Core } from "./Core";
import { PhysicBox, PhysicObject, PhysicPlane, PhysicSphere } from "./PhysicObject";
import { PhysicUnit, Unit } from "./Unit";

/**
 * Sceneの基底クラス、これを継承して用いる
 * Init()に起動時の処理を追加する
 */
export abstract class Scene {
    public units: Unit[] = [];
    public core: Core = null;
    public scene: THREE.Scene;
    public backgroundColor: THREE.Color;
    public raycaster: THREE.Raycaster;
    public camera: THREE.PerspectiveCamera;
    public scene2d: THREE.Scene;
    public camera2d: THREE.OrthographicCamera;
    public physicWorld: Cannon.World;
    public frame: number = 0;
    public fov: number = 75;
    public canvasSizeX: number;
    public canvasSizeY: number;
    public renderer: THREE.WebGLRenderer;
    public composer: THREE.EffectComposer = null;
    public composer2d: THREE.EffectComposer = null;
    public offScreenRenderTarget: THREE.WebGLRenderTarget;
    public offScreen: THREE.Sprite;
    public offScreenMat: THREE.SpriteMaterial;
    public renderTarget: THREE.WebGLRenderTarget;
    public id: string = "";
    public physicStep: number = 1 / 60;
    public colliders: Figure[] = [];
    public textCanvas: HTMLCanvasElement;
    public textCanvasSprite: THREE.Sprite;
    public textCanvasSpriteMat: THREE.SpriteMaterial;
    public textCanvasX: number;
    public textCanvasY: number;
    public ctx: CanvasRenderingContext2D;
    public onMouseMove: (e: MouseEvent) => void = null;
    public onMouseClick: (e: Event) => void = null;
    public onWindowResize: (e: UIEvent) => void = null;
    public onScreenResize: () => void = null;
    public onMouseUp: (e: MouseEvent) => void = null;
    public onMouseDown: (e: MouseEvent) => void = null;
    public onWheel: (e: WheelEvent) => void = null;
    public onLoadError: (e: ErrorEvent) => void = null;
    public onTouchStart: (e: TouchEvent) => void = null;
    public onTouchMove: (e: TouchEvent) => void = null;
    public onTouchEnd: (e: TouchEvent) => void = null;
    public onContextmenu: (e: MouseEvent) => void = null;
    public onKeyKeyDown: (e: KeyboardEvent) => void = null;
    public onKeyKeyUp: (e: KeyboardEvent) => void = null;
    public onBlur: (e: FocusEvent) => void = null;

    /**
     * 初期化処理はInit()に記述すべきでコンストラクタはパラメータの受け渡しのみに用いること
     */
    constructor() {
        this.canvasSizeX = 640;
        this.canvasSizeY = 480;
        this.backgroundColor = new THREE.Color(0x000000);
        this.raycaster = new THREE.Raycaster();
        this.scene = new THREE.Scene();
        this.scene2d = new THREE.Scene();
        this.physicWorld = new Cannon.World();
        this.physicWorld.gravity.set(0, -9.82, 0);
        this.physicWorld.broadphase = new Cannon.NaiveBroadphase();
        this.physicWorld.solver.iterations = 5;
    }

    /**
     * この関数は基本的にオーバーライドすべきでない
     */
    public InnerUpdate(): void {
        this.frame++;
        // 有効でなくなったUnitの削除処理を行ってからUpdate()を実行する
        this.Remove();
        this.units.forEach((u) => {
            u.InnerUpdate();
            u.Update();
        });
        this.physicWorld.step(this.physicStep);
        collide(this.colliders);
    }

    /**
     * このシーンに属しているunitインスタンスのうち指定した条件を満たすものの配列を返す
     * @param filter フィルター関数
     */
    public UnitSelector(filter: (u: Unit) => boolean): Unit[] {
        return this.units.filter(filter);
    }

    /**
     * Updateの処理を記述するにはこの関数をオーバーライドする
     */
    public Update(): void {
        return;
    }

    /**
     * 3Dオブジェクト等や3次元座標等から画面に描画した際の2次元座標を取得
     * @param input 3Dオブジェクト等や3次元座標等
     */
    public GetScreenPosition(input: THREE.Object3D |
                                    THREE.Vector3 |
                                    Cannon.Vec3 |
                                    PhysicObject |
                                    [number, number, number])
                            : [number, number] {
        const p = new THREE.Vector3();
        if (input instanceof THREE.Vector3) {
            p.copy(input);
        } else if (input instanceof THREE.Object3D) {
            p.copy(input.position);
        } else if (input instanceof Cannon.Vec3) {
            p.set(input.x, input.y, input.z);
        } else if (input instanceof PhysicObject) {
            p.set(input.position.x, input.position.y, input.position.z);
        } else {
            p.set(input[0], input[1], input[2]);
        }
        p.project(this.camera);
        return [p.x * this.core.windowSizeX / 2, p.y * this.core.windowSizeY / 2];
    }

    /**
     * レイキャストを行う
     * raycastTargetがtrueとなっているUnitの3Dオブジェクトが対象
     * レイキャストに成功した場合UnitのonRaycastCallbackを呼ぶ
     * @param data messageはUnitに対して処理を分岐させるパラメータ、positionはレイキャストを行う画面上の座標で省略時はマウス座標
     */
    public Raycast(data: {message?: object, position?: THREE.Vec2} = {message: null, position: null}): void {
        if (data.position === null || data.position === undefined) {
            data.position = {x: this.core.mouseX / (this.core.windowSizeX / 2),
                             y: this.core.mouseY / (this.core.windowSizeY / 2)};
        }
        this.raycaster.setFromCamera(data.position, this.camera);
        this.units.filter((u) => u.raycastTarget).forEach((u) => {
            const intersects = this.raycaster.intersectObjects(u.allObject3D, true);
            if (intersects.length !== 0) {
                u.onRaycastedCallback(intersects, data.message);
            }
        });
    }

    /**
     * レイキャストを行いIntersectsを返す。
     * @param position レイキャストを行う画面上の座標で省略時はマウス座標
     */
    public GetIntersects(position: THREE.Vec2 = null): THREE.Intersection[] {
        if (position === null || position === undefined) {
            position = {x: this.core.mouseX / (this.core.windowSizeX / 2),
                        y: this.core.mouseY / (this.core.windowSizeY / 2)};
        }
        this.raycaster.setFromCamera(position, this.camera);
        const objs = new Array<THREE.Object3D>();
        this.units.filter((u) => u.raycastTarget).forEach((u) => {
            Array.prototype.push.apply(objs, u.allObject3D);
        });
        return this.raycaster.intersectObjects(objs, true);
    }

    public Render(): void {
        this.core.renderer.setClearColor(this.backgroundColor);
        if (this.composer === null) {
            // 3D用のシーンでcomposerを使っていなければオフスクリーンレンダリングの結果を用いる
            this.core.renderer.render(this.scene, this.camera , this.offScreenRenderTarget);
            this.offScreenMat.map = this.offScreenRenderTarget.texture;
        } else {
            // 3D用のシーンでcomposerを使っていればcomposerの結果出力バッファを用いる
            this.composer.render();
            this.offScreenMat.map = this.composer.readBuffer.texture;
        }
        // 3Dの描画結果を入れたspriteの大きさを画面サイズにセット
        this.offScreen.scale.set(this.core.windowSizeX, this.core.windowSizeY, 1);
        this.textCanvasSprite.scale.set(this.textCanvasX, this.textCanvasY, 1);
        // const ctx = this.textCanvas.getContext("2d");
        // ctx.font = "50px serif";
        // ctx.clearRect(0, 0, this.textCanvasX, this.textCanvasY);
        // ctx.fillText("hoge", this.textCanvasX / 2, this.textCanvasY / 2);
        this.textCanvasSpriteMat.map.needsUpdate = true;
        if (this.composer2d === null) {
            // this.core.offScreenRenderTargetに描画し、その結果をthis.core.offScreenMat.mapに設定する
            this.core.renderer.render(this.scene2d, this.camera2d, this.renderTarget);
        } else {
            // omposerの結果出力バッファをthis.core.offScreenMat.mapに設定する
            this.composer2d.render();
        }
    }

    /**
     * ゲームエンジンで使用しているTHREE.WebGLRendererを使うTHREE.EffectComposerを生成する
     */
    public MakeEffectComposer(): THREE.EffectComposer {
        const c = new THREE.EffectComposer(this.renderer);
        c.setSize(this.canvasSizeX, this.canvasSizeY);
        return c;
    }

    /**
     * テキストのサイズを指定する
     * @param size ピクセル単位のサイズ
     */
    public SetTextSize(size: number): void {
        this.ctx.font = size.toString() + "px serif";
    }

    /**
     * テキストの色を指定する
     * @param color 指定する色
     */
    public SetTextColor(color: THREE.Color): void {
        this.ctx.fillStyle = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
    }

    /**
     * 指定した座標に文字列を描画する
     * @param str 描画する文字列
     * @param x X座標
     * @param y Y座標
     * @param maxWidth 最大横幅
     */
    public FillText(str: string, x: number, y: number, maxWidth: number = null): void {
        if (maxWidth === null) {
            this.ctx.fillText(str, this.textCanvasX / 2 + x, this.textCanvasY / 2 - y);
        } else {
            this.ctx.fillText(str, this.textCanvasX / 2 + x, this.textCanvasY / 2 - y, maxWidth);
        }
    }

    public RenderedTexture(): THREE.Texture {
        if (this.composer2d === null) {
            return this.renderTarget.texture;
        } else {
            return this.composer2d.readBuffer.texture;
        }
    }

    /**
     * 基本的にこの関数はオーバーライドすべきでない
     */
    public InnerDrawText(): void {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.textCanvasX, this.textCanvasY);
            this.ctx.font = "50px serif";
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "top";
        }
        this.units.forEach((u) => {
            u.DrawText();
        });
    }

    /**
     * 文字の描画処理を記述するにはこの関数をオーバーライドする
     */
    public DrawText(): void {
        return;
    }

    /**
     * 起動時の初期化処理を記述するためにはこの関数をオーバーライドする。
     */
    public Init(): void {
        return;
    }

    /**
     * この関数は基本的にオーバーライドすべきでない
     */
    public InnerInit(): void {
        this.units.forEach((u) => {
            u.Init();
        });
        this.renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true});
        this.renderer.setSize(this.canvasSizeX, this.canvasSizeY);
        this.camera = new THREE.PerspectiveCamera(this.fov, this.canvasSizeX / this.canvasSizeY, 0.1, 5000);
        this.camera2d = new THREE.OrthographicCamera(
            -this.canvasSizeX / 2, this.canvasSizeX / 2,
            this.canvasSizeY / 2, -this.canvasSizeY / 2,
            1, 10 );
        this.camera2d.position.z = 10;
        this.offScreenMat = new THREE.SpriteMaterial({
            color: 0xFFFFFF,
        });
        this.offScreenRenderTarget = new THREE.WebGLRenderTarget(
            this.canvasSizeX, this.canvasSizeY, {
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
        });
        this.offScreen = new THREE.Sprite(this.offScreenMat);
        this.offScreen.scale.set(this.canvasSizeX, this.canvasSizeY, 1);
        this.offScreen.position.set(0, 0, 1);
        this.scene2d.add(this.offScreen);
        this.renderTarget = new THREE.WebGLRenderTarget(
            this.canvasSizeX, this.canvasSizeY, {
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
        });
        this.textCanvas = document.createElement("canvas");
        this.textCanvasX = 2 ** Math.ceil(Math.log2(this.canvasSizeX));
        this.textCanvasY = 2 ** Math.ceil(Math.log2(this.canvasSizeY));
        this.textCanvas.setAttribute("width", this.textCanvasX + "");
        this.textCanvas.setAttribute("height", this.textCanvasY + "");
        this.ctx = this.textCanvas.getContext("2d");
        this.textCanvasSpriteMat = new THREE.SpriteMaterial({
            color: 0xffffff, map: new THREE.CanvasTexture(this.textCanvas)});
        this.textCanvasSprite = new THREE.Sprite(this.textCanvasSpriteMat);
        this.textCanvasSprite.position.set(0, 0, 9);
        this.textCanvasSprite.scale.set(this.textCanvasX, this.textCanvasY, 1);
        this.scene2d.add(this.textCanvasSprite);
    }

    /**
     * シーンにUnitを追加する
     * 追加されたUnitは毎フレームUpdateやDrawText等が呼ばれるようになる
     * UnitのisAliveがfalseになると自動で取り除かれる
     * @param u 追加するUnit
     */
    public AddUnit(u: Unit): void {
        // Initを実行してからリストに追加
        u.scene = this;
        u.core = this.core;
        u.Init();
        this.units.push(u);
    }

    /**
     * 基本的にこの関数はオーバーライドすべきでない
     */
    public InnerFin(): void {
        this.DeleteUnits(this.units);
        this.units = [];
    }

    /**
     * シーン削除時の処理を記述するためにはこの関数をオーバーライドする。
     */
    public Fin(): void {
        return;
    }

    public ResizeCanvas(sizeX: number, sizeY: number): void {
        this.canvasSizeX = sizeX;
        this.canvasSizeY = sizeY;
        this.renderer.setSize(this.canvasSizeX, this.canvasSizeY);
        this.camera.aspect = this.canvasSizeX / this.canvasSizeY;
        this.camera.updateProjectionMatrix();
        this.camera2d.left = -this.canvasSizeX / 2;
        this.camera2d.right = this.canvasSizeX / 2;
        this.camera2d.bottom = -this.canvasSizeY / 2;
        this.camera2d.top = this.canvasSizeY / 2;
        this.camera2d.updateProjectionMatrix();
        this.offScreenRenderTarget.setSize(
            this.canvasSizeX,
            this.canvasSizeY);
        this.renderTarget.setSize(
            this.canvasSizeX,
            this.canvasSizeY);
        if (this.composer) {
            this.composer.setSize(this.canvasSizeX, this.canvasSizeY);
        }
        if (this.composer2d) {
            this.composer2d.setSize(this.canvasSizeX, this.canvasSizeY);
        }
        this.textCanvasX = 2 ** Math.ceil(Math.log2(this.canvasSizeX));
        this.textCanvasY = 2 ** Math.ceil(Math.log2(this.canvasSizeY));
        this.textCanvas.setAttribute("width", this.textCanvasX + "");
        this.textCanvas.setAttribute("height", this.textCanvasY + "");
    }

    public LoadFromFile(filename: string): void {
        const loader = new THREE.FileLoader();
        loader.load(filename, (res) => {
            if (typeof res !== "string") {
                throw new Error("file is binary.");
            }
            const objs = JSON.parse(res);
            // 各unit
            objs.forEach((obj) => {
                const u: Unit = new PhysicUnit();
                this.AddUnit(u);
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
                                sphere.phyBody.position.set(x, y, z);
                                u.AddPhysicObject(sphere);
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
                                box.phyBody.position.set(x, y, z);
                                u.AddPhysicObject(box);
                                break;
                            }
                            case "plane": {
                                console.log("plane");
                                const axisx: number = physic.axisx;
                                const axisy: number = physic.axisy;
                                const axisz: number = physic.axisz;
                                const mass: number = physic.number;
                                const angle: number = physic.angle;
                                const plane = new PhysicPlane(mass);
                                plane.phyBody.quaternion.setFromAxisAngle(new Cannon.Vec3(axisx, axisy, axisz), angle);
                                u.AddPhysicObject(plane);
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

    protected Remove(): void {
        // 有効でなくなったUnitに紐づけられてるObject3Dを削除し、PhysicObjectも削除し、Fin()を呼び出す
        this.DeleteUnits(this.units.filter((u) => !u.isAlive));
        // Unitのリストから有効でなくなったものを取り除く
        this.units = this.units.filter((u) => u.isAlive);
    }

    private DeleteUnits(units: Unit[]): void {
        units.forEach((u) => {
            u.objects.forEach((o) => this.scene.remove(o));
            u.sprites.forEach((s) => u.RemoveSprite(s));
            u.physicObjects.forEach((p) => u.RemovePhysicObject(p));
            u.colliders.forEach((f) => u.RemoveCollider(f));
            u.Fin();
            u.objects = [];
            u.allObject3D = [];
            u.sprites = [];
            u.physicObjects = [];
            u.scene = null;
            u.core = null;
        });
    }
}
