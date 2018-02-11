
import {BoxHelperExt} from '../three/BoxHelperExt';

window.AFRAME = require('aframe');
const AFRAME = window.AFRAME;
const THREE = AFRAME.THREE;

/**
 * creates a axis aligned bounding box (aabb) for a entity it is attached to
 *
 * Example:
 * <a-sphere bb ></a-sphere>
 *
 */

AFRAME.registerComponent('bb', {
  init: function () {
    var obj = this.el.getObject3D('mesh') || this.el.object3D;

    if (!obj) console.error('no obj defined for bbox helper');

    var helper = new BoxHelperExt(obj);

    obj.parent.add(helper);

    requestAnimationFrame(function animate () {
      helper.update(undefined, obj.parent, true, false);

      // requestinf frame after update .. in case update fails it will not pollute the log
      requestAnimationFrame(animate);
    });
  }
});
