/**
 * Ballpit-style environment collision: XR Blocks **depth mesh** → Rapier trimesh
 * (`depth.depthMesh.initRapierPhysics` in Core), not WebXR plane detection.
 *
 * Spawn + sync follow Ballpit (BallShooter): parent meshes under this script and
 * update transforms in `physicsStep()`.
 * @see https://xrblocks.github.io/docs/samples/Ballpit/
 */
import * as THREE from 'three'
import * as xb from 'xrblocks'

function randomColor() {
  return Math.floor(Math.random() * 0xffffff)
}

class SpawnSphereButton extends xb.TextButton {
  /**
   * @param {PlanePhysicsScene} scene
   */
  constructor(scene) {
    super({
      text: 'Sphere',
      backgroundColor: '#2d3f66',
      fontSize: 0.036,
      fontColor: 0xffffff,
      width: 0.46,
      height: 0.82,
    })
    this.spawnScene = scene
  }

  onTriggered() {
    this.spawnScene.spawnSphere()
  }
}

class SpawnCubeButton extends xb.TextButton {
  /**
   * @param {PlanePhysicsScene} scene
   */
  constructor(scene) {
    super({
      text: 'Cube',
      backgroundColor: '#3d5c4a',
      fontSize: 0.036,
      fontColor: 0xffffff,
      width: 0.46,
      height: 0.82,
    })
    this.spawnScene = scene
  }

  onTriggered() {
    this.spawnScene.spawnCube()
  }
}

export class PlanePhysicsScene extends xb.Script {
  constructor() {
    super()
    /** @type {import('@dimforge/rapier3d-compat').World | null} */
    this.world = null
    /** @type {any} */
    this.RAPIER = null
    /** @type {Array<{ mesh: THREE.Mesh; body: import('@dimforge/rapier3d-compat').RigidBody }>} */
    this.spawned = []
  }

  async init() {
    this.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(2, 4, 3)
    this.add(sun)
    await this.buildSpawnPanel()
    xb.add(this)
  }

  async buildSpawnPanel() {
    const panel = new xb.SpatialPanel({
      backgroundColor: '#1a1a22cc',
      width: 0.52,
      height: 0.11,
      useDefaultPosition: false,
      draggable: true,
      keepFacingCamera: true,
      showHighlights: true,
      touchable: true,
    })
    panel.isRoot = true
    this.add(panel)

    const grid = panel.addGrid()
    const row = grid.addRow({ weight: 1 })
    const sphereBtn = new SpawnSphereButton(this)
    const cubeBtn = new SpawnCubeButton(this)
    sphereBtn.weight = 0.5
    cubeBtn.weight = 0.5
    row.add(sphereBtn)
    row.add(cubeBtn)

    const z = -Math.min(xb.user.panelDistance * 0.55, 1.1)
    panel.position.set(0, xb.user.height - 0.18, z)
    panel.updateLayouts()
  }

  /**
   * @param {import('xrblocks').Physics} physics
   */
  initPhysics(physics) {
    this.world = physics.blendedWorld
    this.RAPIER = physics.RAPIER
  }

  getSpawnPoint() {
    const cam = xb.core.camera
    const p = new THREE.Vector3()
    cam.getWorldPosition(p)
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
    p.addScaledVector(dir, 0.55)
    p.y += 0.25
    return p
  }

  spawnSphere() {
    if (!this.world || !this.RAPIER) return

    const RAPIER = this.RAPIER
    const p = this.getSpawnPoint()
    const radius = 0.06 + Math.random() * 0.04

    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(p.x, p.y, p.z)
        .setLinearDamping(0.2)
        .setAngularDamping(0.2)
        .setCcdEnabled(true),
    )
    this.world.createCollider(
      RAPIER.ColliderDesc.ball(radius)
        .setDensity(2.0)
        .setRestitution(0.35),
      body,
    )

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshLambertMaterial({
        color: randomColor(),
      }),
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.copy(p)
    this.add(mesh)
    this.spawned.push({ mesh, body })
  }

  spawnCube() {
    if (!this.world || !this.RAPIER) return

    const RAPIER = this.RAPIER
    const p = this.getSpawnPoint()
    const hx = 0.05 + Math.random() * 0.03
    const hy = 0.05 + Math.random() * 0.03
    const hz = 0.05 + Math.random() * 0.03

    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(p.x, p.y, p.z)
        .setLinearDamping(0.25)
        .setAngularDamping(0.25)
        .setCcdEnabled(true),
    )
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(hx, hy, hz)
        .setDensity(2.0)
        .setRestitution(0.2),
      body,
    )

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2),
      new THREE.MeshLambertMaterial({
        color: randomColor(),
      }),
    )
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.copy(p)
    this.add(mesh)
    this.spawned.push({ mesh, body })
  }

  physicsStep() {
    for (const { mesh, body } of this.spawned) {
      const t = body.translation()
      const r = body.rotation()
      mesh.position.set(t.x, t.y, t.z)
      mesh.quaternion.set(r.x, r.y, r.z, r.w)
    }
  }
}
