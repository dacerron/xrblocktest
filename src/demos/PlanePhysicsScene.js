/**
 * Plane detection + Rapier physics (same integration path as XR Blocks Core).
 * - XR Blocks: World / PlaneDetector / DetectedPlane meshes from WebXR or simulator.
 * - Physics: Rapier via `options.physics` (explicit `@dimforge/rapier3d-compat` import).
 * - This script adds kinematic trimesh colliders for each plane mesh and dynamic balls/boxes.
 */
import * as THREE from 'three'
import * as xb from 'xrblocks'

const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()

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

/**
 * @param {THREE.BufferGeometry} geometry
 * @returns {{ vertices: Float32Array, indices: Uint32Array } | null}
 */
function getTrimeshArrays(geometry) {
  const pos = geometry.attributes.position
  if (!pos) return null
  const vertices = new Float32Array(pos.array)
  const idx = geometry.getIndex()
  if (!idx) return null
  return { vertices, indices: new Uint32Array(idx.array) }
}

export class PlanePhysicsScene extends xb.Script {
  constructor() {
    super()
    /** @type {import('@dimforge/rapier3d-compat').World | null} */
    this.world = null
    /** @type {any} */
    this.RAPIER = null
    /** @type {Map<THREE.Mesh, { body: import('@dimforge/rapier3d-compat').RigidBody }>} */
    this.planeBodies = new Map()
    /** @type {Array<{ mesh: THREE.Mesh; body: import('@dimforge/rapier3d-compat').RigidBody }>} */
    this.spawned = []
  }

  async init() {
    this.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(2, 4, 3)
    this.add(sun)
    await this.buildSpawnPanel()
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

  onSimulatorStarted() {
    this.ensureSimulatorFloor()
  }

  /**
   * Desktop simulator does not load planes unless `simulator.scenePlanesPath` is set.
   * XR Blocks' `PlaneDetector.get()` omits simulator-only planes, so we use `children`.
   */
  ensureSimulatorFloor() {
    const pd = xb.world.planes
    if (!pd || pd.children.length > 0) return

    const z = -xb.user.objectDistance
    pd.setSimulatorPlanes([
      {
        type: 'horizontal',
        area: 6,
        position: new THREE.Vector3(0, 0, z),
        quaternion: new THREE.Quaternion(),
        polygon: [
          new THREE.Vector2(-1.2, -0.9),
          new THREE.Vector2(1.2, -0.9),
          new THREE.Vector2(1.2, 0.9),
          new THREE.Vector2(-1.2, 0.9),
        ],
      },
    ])
  }

  getPlaneMeshes() {
    const pd = xb.world.planes
    if (!pd) return []
    return pd.children.filter(
      (c) => c.isMesh && c.geometry && c.geometry.attributes.position,
    )
  }

  ensurePlaneColliders() {
    if (!this.world || !this.RAPIER) return

    const RAPIER = this.RAPIER
    const meshes = this.getPlaneMeshes()

    for (const mesh of meshes) {
      if (this.planeBodies.has(mesh)) continue

      const data = getTrimeshArrays(mesh.geometry)
      if (!data) continue

      mesh.updateMatrixWorld(true)

      const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
        .setRotation({
          x: mesh.quaternion.x,
          y: mesh.quaternion.y,
          z: mesh.quaternion.z,
          w: mesh.quaternion.w,
        })

      const body = this.world.createRigidBody(bodyDesc)
      const colliderDesc = RAPIER.ColliderDesc.trimesh(
        data.vertices,
        data.indices,
      ).setFriction(1.0)
      this.world.createCollider(colliderDesc, body)
      this.planeBodies.set(mesh, { body })
    }
  }

  syncPlaneKinematics() {
    if (!this.world || !this.RAPIER) return

    for (const [mesh, { body }] of this.planeBodies) {
      if (!mesh.parent) {
        this.world.removeRigidBody(body)
        this.planeBodies.delete(mesh)
        continue
      }
      mesh.updateMatrixWorld(true)
      mesh.getWorldPosition(_v)
      mesh.getWorldQuaternion(_q)
      body.setNextKinematicTranslation({ x: _v.x, y: _v.y, z: _v.z })
      body.setNextKinematicRotation({ x: _q.x, y: _q.y, z: _q.z, w: _q.w })
    }
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
        .setAngularDamping(0.2),
    )
    this.world.createCollider(
      RAPIER.ColliderDesc.ball(radius)
        .setDensity(2.0)
        .setRestitution(0.35),
      body,
    )

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshStandardMaterial({
        color: randomColor(),
        roughness: 0.45,
        metalness: 0.05,
      }),
    )
    mesh.position.copy(p)
    xb.scene.add(mesh)
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
        .setAngularDamping(0.25),
    )
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(hx, hy, hz)
        .setDensity(2.0)
        .setRestitution(0.2),
      body,
    )

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2),
      new THREE.MeshStandardMaterial({
        color: randomColor(),
        roughness: 0.5,
        metalness: 0.05,
      }),
    )
    mesh.position.copy(p)
    xb.scene.add(mesh)
    this.spawned.push({ mesh, body })
  }

  syncSpawnedMeshes() {
    for (const { mesh, body } of this.spawned) {
      const t = body.translation()
      const r = body.rotation()
      mesh.position.set(t.x, t.y, t.z)
      mesh.quaternion.set(r.x, r.y, r.z, r.w)
    }
  }

  update() {
    this.ensurePlaneColliders()
    this.syncPlaneKinematics()
    this.syncSpawnedMeshes()
  }
}
