import TWEEN from '@tweenjs/tween.js';
import {querySelectorAll} from './selector-utils';
import {getWorldPosition} from './aframe-utils';

import {Animation} from '@nk11/animation-lib/src/js/animation/Animation';

/**
 * static helper for smooth navigation within 3D space
 *
 * TODO refactor.... the look-at animation is flawed
 * TODO also provide better options duration, pause,play, stop, etc and dont make it static anymore
 * @deprecated refactor/extend and/ or use animation-lib instead
 */

export default class ZoomUtil {
  static moveToThreeCSSSelector (selector, rootEl) {
    if (!rootEl) { rootEl = document.querySelector('a-scene'); }

    var cameraEl = rootEl.sceneEl.camera.el;

    var targetMesh = querySelectorAll(rootEl.object3D, selector)[0];
    var camera = rootEl.sceneEl.camera;
    var lookAtVector = new THREE.Vector3(0, 0, -1);
    var lookAtVectorOrig = camera.applyQuaternion(camera.quaternion);

    // cameraEl.setAttribute("position",);
    var targetPosition = getWorldPosition(targetMesh);
    ZoomUtil.moveToMesh(targetMesh, camera, lookAtVectorOrig, 10, function onComplete () {
      rootEl.sceneEl.camera.el.setAttribute('position', targetPosition);
    });
  }

  /**
     * moves the camera position to a target mesh
     * for further details {@link ZoomUtil.moveToPosition}
     *
     * @param mesh: {@link THREE.Mesh}
     *
     */

  static moveToMesh (mesh, camera, cameraTargetPosition, cameraDistanceToMesh = 400, onComplete = function () {
  }) {
    var position = new THREE.Vector3();
    position.setFromMatrixPosition(mesh.matrixWorld);

    ZoomUtil.moveToPosition(position, camera, cameraTargetPosition, cameraDistanceToMesh, onComplete);
  }

  /**
     * animates the position and rotation of a given camera {@link THREE.Camera} to the target position
     *
     * @param {THREE.Vector3} position - A target position must be provided in world coordinates.
     * @param camera - {@link THREE.Camera}
     * @param {THREE.Vector3} cameraTargetPosition - instanceof THREE.Vector3 containing the position the camera is looking at.
     * @param {number} cameraDistanceToMesh - The distance to the target position the camera will stop at.
     * @param {callback} onComplete -  a callback function that is triggered when the animation phase has ended and the camera is at the target location
     * @param {callback} onUpdate -  a callback function that is triggered each animation frame when in transition
     */
  static moveToPosition (position, camera, cameraTargetPosition, cameraDistanceToMesh = 400, onComplete = function () {
  }, onUpdate = function () {
  }) {
    var mTimeout;

    // var vec3Start = camera.el.object3D.position;
    var vec3Start = camera.position;

    //  var vec3End = new THREE.Vector3();
    //  vec3End.setFromMatrixPosition(mesh.matrixWorld);
    var vec3End = position;

    // we want to have a fixed distance to a node when selecting
    var distVec = vec3End.clone().sub(vec3Start);
    var len = distVec.length();
    distVec.normalize();
    distVec.multiplyScalar(cameraDistanceToMesh); // apply fixed distance to the target

    var alteredVecEnd = vec3End.clone().sub(distVec);

    // -------------------------------------
    // rotate the vector to be orientated on 0,0,1   //this will have not much impact on the 3d zoom but will prevent the 2d zoom from rotating
    // TODO find an alternative solution

    let distVec2d = new THREE.Vector3(0, 0, -1).multiplyScalar(distVec.length());
    alteredVecEnd = vec3End.clone().sub(distVec2d);

    // -------------------------------------

    let prevAnimation = new Animation({position: camera.position, target: cameraTargetPosition});
    prevAnimation.animate({position: alteredVecEnd, target: vec3End}, 400, onComplete, onUpdate);

    // ------------------------------------
    return prevAnimation;
  }
}
