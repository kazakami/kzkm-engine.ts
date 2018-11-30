import { Core } from "../Core";
import { Scene } from "../Scene";
import { Unit } from "../Unit";

class TestScene extends Scene {}
class TestUnit extends Unit {
    public inited = false;
    public finned = false;
    public Init(): void { this.inited = true; }
    public Fin(): void { this.finned = true; }
}

test("constructor", () => {
    const scene = new TestScene();
    expect(scene.core).toBe(null);
});

test("this.frame increase by call of InnerUpdate()", () => {
    const scene = new TestScene();
    scene.InnerUpdate();
    scene.InnerUpdate();
    scene.InnerUpdate();
    expect(scene.frame).toBe(3);
});

test("InnerInit() generate cameras", () => {
    const c = new Core({});
    c.windowSizeX = 640;
    c.windowSizeY = 480;
    const scene = new TestScene();
    scene.core = c;
    scene.InnerInit();
    expect(scene.camera).not.toBe(null);
    expect(scene.camera2d).not.toBe(null);
});

test("remove unit if isAlive is false", () => {
    const scene = new TestScene();
    const unit = new TestUnit();
    unit.isAlive = false;
    scene.AddUnit(unit);
    expect(scene.units[0]).toEqual(unit);
    scene.InnerUpdate();
    expect(scene.units.length).toBe(0);
});

test("innerInit() call unit.Init()", () => {
    const c = new Core({});
    c.windowSizeX = 640;
    c.windowSizeY = 480;
    const scene = new TestScene();
    scene.core = c;
    const unit = new TestUnit();
    scene.units.push(unit);
    scene.InnerInit();
    expect(unit.inited).toEqual(true);
});

test("AddUnit() call unit.Init()", () => {
    const scene = new TestScene();
    const unit = new TestUnit();
    scene.AddUnit(unit);
    expect(unit.inited).toEqual(true);
});

test("InnerUpdate() call unit.Update()", () => {
    const scene = new TestScene();
    const unit = new TestUnit();
    scene.AddUnit(unit);
    scene.InnerUpdate();
    scene.InnerUpdate();
    scene.InnerUpdate();
    expect(unit.frame).toEqual(3);
});

test("InnerFin() call unit.Fin()", () => {
    const scene = new TestScene();
    const unit = new TestUnit();
    scene.AddUnit(unit);
    scene.InnerFin();
    expect(unit.finned).toEqual(true);
    expect(scene.units).toEqual([]);
});
