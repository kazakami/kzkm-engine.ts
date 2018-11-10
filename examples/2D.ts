import * as THREE from "three";
import { Random, RandomColor, Scene, Start, Unit } from "../src/main";

class LoadScene extends Scene {
    public Init(): void {
        super.Init();
        this.core.LoadTexture("resources/png_alphablend_test.png", "circle");
        this.core.LoadTexture("resources/star.png", "star");
        this.core.LoadTexture("resources/fire.png", "fire");
    }
    public Update(): void {
        super.Update();
        console.log(this.core.GetAllResourcesLoadingProgress());
        if (this.core.IsAllResourcesAvaiable()) {
            console.log("change");
            // オブジェクトenteが読み込まれればシーン遷移
            this.core.AddAndChangeScene("game", new GameScene());
        } else {
            console.log("now loading resources");
        }
    }
}

class GameScene extends Scene {
    public sprt: THREE.Sprite;
    public Init(): void {
        super.Init();
        this.backgroundColor = new THREE.Color(0x887766);
        this.sprt = this.core.MakeSpriteFromTexture("circle");
        this.sprt.scale.set(100, 100, 1);
        this.scene2d.add(this.sprt);
        this.onMouseClickCallback = () => {
            // this.core.SaveImage("ScreenShot.png");
        };
        this.onWindowResizeCallback = () => {
            this.core.ChangeCanvasSize(window.innerWidth, window.innerHeight);
        };
    }
    public Update(): void {
        super.Update();
        this.sprt.position.set(this.core.mouseX, this.core.mouseY, 1);
        if (this.core.IsKeyPressing("q")) {
            this.AddUnit(new Fire(this.core.mouseX, this.core.mouseY));
        }
    }
    public Draw(): void {
        super.Draw();
        this.core.DrawText(this.core.GetAllDownKey().join(), this.core.mouseX, this.core.mouseY);
    }
}

class Fire extends Unit {
    private sprite: THREE.Sprite;
    constructor(private x, private y) { super(); }
    public Init(): void {
        this.sprite = this.core.MakeSpriteFromTexture("fire");
        this.sprite.scale.set(32, 32, 1);
        this.sprite.position.set(this.x, this.y, 1);
        this.AddSprite(this.sprite);
    }
    public Update(): void {
        super.Update();
        if (this.frame > 100) {
            this.isAlive = false;
        }
    }
}

// ゲームの開始
Start("init", new LoadScene());
