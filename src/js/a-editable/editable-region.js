/**
 *
 * TODO
 *
 *
 */
import $ from 'jquery';
import {findClosestEntity, getDirectionForEntity} from '../util';
import {getHotkeyDialog, getTextEditorInstance} from './utils';
import pretty from 'pretty';

import 'aframe-gridhelper-component';

window.AFRAME = require('aframe');
const AFRAME = window.AFRAME;
const THREE = AFRAME.THREE;

AFRAME.registerComponent('editable-region', {
  schema: {
    src: {type: 'string'}
  },
  init: function () {
    this.mInitialized = false;

    if (this.data.src) return; // delay rendering content

    var el = this.el;

    // var element = $(`<a-entity static-body gridhelper="size:50;divisions:50"></a-entity>`);

    var element = $(` <a-plane class="todo-grid" shadow="cast: false; receive: true"  position="0 0 0" rotation="-90 0 0" width="20" height="20" color="#7BC8A4" static-body ></a-plane>`);
    var element2 = $(` <a-plane class="todo-grid" shadow="cast: false; receive: true"  position="18 0 18" rotation="-90 0 0" width="20" height="20" color="#7B0000" static-body ></a-plane>`);

    var playfield = ` 
    
<a-entity scale="0.8 1 0.5">


    <a-plane class="goal" src="/assets/images/grids/metal1.jpg"  shadow="cast: true; receive: true" position="50 0 0" rotation="0 90 0" color="rgb(205,205,205)"  static-body="shape:hull" material="side: double;transparent: true; opacity: 0.5" height="8" width=20></a-plane>

    <a-plane class="goal" src="/assets/images/grids/metal1.jpg"  shadow="cast: true; receive: true" position="-50 0 0" rotation="0 90 0" color="rgb(55,55,55)"  static-body="shape:hull" material="side: double;transparent: true; opacity: 0.5" height="8" width=20></a-plane>



    <a-plane class="floor" shadow="cast: false; receive: true"  src="/assets/images/grids/Soccer-Football-Field-Lines.jpg"  position="0 0 0" rotation="-90 0 0" width="110" height="110" color="#7BC8A4" static-body ></a-plane>
    <a-plane class="second-floor"position="0 -1 0" src="/assets/images/grids/metal1.jpg" rotation="-90 0 0" width="250" height="250" color="#7BC8A4" static-body ></a-plane>

    <!--    <a-box position="0 0 0" material="repeat:2 2" src="/assets/images/grids/metal6.jpg"  color="#7BC8A4" static-body  width="100" height="1" depth="100"></a-box> -->



    <a-cylinder class="border"   shadow="cast: false; receive: true"  open-ended=true repeat="0.1 1" src="/assets/images/grids/metal1.jpg" segments-height=1 segments-radial=18  position="50 4 0" rotation="90 0 0" color="#FFC65D"  static-body="shape:hull" material="side: double" theta-length=90 radius="5" height="110"></a-cylinder>

    <a-cylinder class="border"  shadow="cast: false; receive: true"  open-ended=true  repeat="0.1 1" src="/assets/images/grids/metal1.jpg" segments-height=1 segments-radial=18   position="0 4 50" rotation="90 270 0" color="grey"  static-body="shape:hull" material="side: double" theta-length=90 radius="5" height="110"></a-cylinder>

    <a-cylinder class="border"  shadow="cast: false; receive: true"  repeat="0.1 1" open-ended=true src="/assets/images/grids/metal1.jpg" segments-height=1 segments-radial=18   position="-50 4 0" rotation="90 180 0" color="blue"  static-body="shape:hull" material="side: double" theta-length=90 radius="5" height="110"></a-cylinder>

    <a-cylinder class="border"  shadow="cast: false; receive: true"  repeat="0.1 1" open-ended=true src="/assets/images/grids/metal1.jpg" segments-height=1 segments-radial=18   position="0 4 -50" rotation="90 90 0" color="green"  static-body="shape:hull" material="side: double" theta-length=90 radius="5" height="110"></a-cylinder>

</a-entity>
    `;

    // $(el).append(element, element2);

    $(el).append(playfield);
  },

  tick: function (time, timeDelta) {
    // check if actor is close enough or far enough to load unload content

    var actor3D = this.el.sceneEl.camera.parent;
    var el = this.el;

    var distance = actor3D.position.clone().sub(el.object3D.position).length();

    if (distance > 200 && this.mInitialized == true) {
      console.log('detach content');
      this.mInitialized = false;

      $(el).html('');
    }
    if (distance < 100 && this.mInitialized == false) {
      console.log('attach content');
      this.mInitialized = true;
      //  var element = $(`<a-entity static-body gridhelper="size:100;divisions:50"></a-entity>`);
      var element = $(`<a-plane  static-body color="#CCC" rotation="-90 0 0" height="50" width="50"></a-plane>`);

      $(el).append(element);
    }
  }

});
