import {Logger} from '../../utils/Logger';
import {createHTML} from '../../utils/dom-utils';
import Vue from 'vue/dist/vue.esm';

import {suppressedThrottle} from '../../utils/misc-utils';

import * as _ from 'lodash';
import {jsonic} from 'jsonic';
import {getCompoundBoundingBox} from '../../utils/aframe-utils';

/**
 *  TODO helper components order-items-as
 * - grid animate current positions to grid positions
 * - horizontal-list
 * - vertical-list
 * - bin-stacking
 *
 */

// var console = Logger.getLogger('gui-list-view');
// FIXME mappings not working
AFRAME.registerPrimitive('nk-list-view', {
  defaultComponents: {
    'gui-list-view': {
      items: [{key: 0, value: '-empty-'}],
      containerFactory: `<a-entity></a-entity>`,
      itemFactory: `<a-button
              v-for="(item, index) in items"
              :value="item.key"
              :button-color="selectedIndex==index?'slateblue':'slategrey'"
              :position="setPositionFromIndex(index,2,5,2.5,-0.45)" 
              width="2.5"
              height="0.75"
              font-family="Arial"
              margin="0 0 0.05 0"
              @interaction-pick.stop="onItemClicked(item)"
              ></a-button>`
    }
    // rotation: {x: 0, y: -180, z: 0},
    // up: {x: 0, y: -1, z: 0}
  },

  mappings: {
    items: 'gui-list-view.items',
    selectedIndex: 'gui-list-view.selectedIndex',
    itemFactory: 'gui-list-view.itemFactory',
    requiredKeys: 'gui-list-view.requiredKeys',
    overflow: 'gui-list-view.overflow',
    orientation: 'gui-list-view.orientation'

    // TODO orientation for keys
  }
});

/**
 *  TODO efficient rendering by reusing buttons/elements and clipping planes as well as max amount of visible
 *   see https://threejs.org/examples/webgl_clipping_advanced.html
 *   https://stackoverflow.com/questions/36557486/three-js-object-clipping
 *  TODO also create a component with  additional items recursion (most simple treeview)
 * TODO set container size to wrap around buttons to be able to grab events
 *
 *
 *
 */

const listViewItemFactory = `<a-button  
              v-for="(item, index) in items"
              :value="item.key"    
              :background-color="selectedIndex==index?'slateblue':'slategrey'"
              :position="setPositionFromIndex(index,2,5,2.5,-0.45)" 
              width="2.5" 
              height="0.75" 
              font-family="Arial" 
              margin="0 0 0.05 0" 
              @interaction-pick.stop="onItemClicked(item)"         
              ></a-button>`;

AFRAME.registerComponent('gui-list-view', {
  schema: {

    items: {
      type: 'array',
      default: [{key: 0, value: 'hello'}, {key: 1, value: 'world'}]
    },
    requiredKeys: {type: 'array', default: ['key', 'value']},
    overflow: {type: 'boolean', default: false},
    orientation: {type: 'string', default: 'column'},
    arrowFactory: {type: 'string', default: `<a-triangle></a-triangle>`}, // TODO if defined add arrow at start and end
    containerFactory: {type: 'string', default: `<a-entity></a-entity>`},
    itemFactory: {type: 'string', default: listViewItemFactory}
  },
  update: function (oldData) {
    // new entries
    console.warn('listview update', oldData, this.data);
    var addedItems = _.difference(this.data.items, oldData.items);
    var removedItems = _.difference(oldData.items, this.data.items);

    if (addedItems.length > 0) {
      addedItems.forEach(item => this.vm.addItem(item));
      console.log('addedItems', addedItems);
    }
    // removed entries

    if (removedItems.length > 0) {
      removedItems.forEach(item => this.vm.removeItem(item));
      console.log('removedItems', removedItems);
    }

    // ------
    // update view in case the factory methods changed
    if (oldData.containerFactory != this.data.containerFactory || oldData.itemFactory != this.data.itemFactory) {
      this.initViewModel();
    }
  },
  computeBoundingBox: function () {
    this.bb = new THREE.Box3();
    this.bb.setFromObject(this.el.object3D);
    return this.bb;
  },
  addArrows: function () {
    if (!this.minArrow) {
      this.minArrow = createHTML(`<a-triangle></a-triangle>`);

      this.minArrow.addEventListener('interaction-pick', (e) => {
        e.stopPropagation();
        this.vm.$data.selectedIndex--;
      });
    }
    if (!this.maxArrow) {
      this.maxArrow = createHTML(`<a-triangle></a-triangle>`);
      this.maxArrow.addEventListener('interaction-pick', (e) => {
        e.stopPropagation();
        this.vm.$data.selectedIndex++;
      });
    }

    let bb = this.computeBoundingBox();

    let min = bb.min.clone().sub(this.el.object3D.position);
    let max = bb.max.clone().sub(this.el.object3D.position);

    if (this.data.orientation == 'column') {
      let y = (max.y - min.y) / 2;

      min.y += y;
      max.y -= y;

      this.minArrow.object3D.rotation.z = Math.PI / 2;
      this.maxArrow.object3D.rotation.z = -Math.PI / 2;
    } else {
      let x = (max.x - min.x) / 2;
      min.x += x;
      max.x -= x;

      this.minArrow.object3D.rotation.z = 0;
      this.maxArrow.object3D.rotation.z = 0;
    }

    this.minArrow.object3D.position.copy(min);
    this.maxArrow.object3D.position.copy(max);

    this.vm.$el.append(this.minArrow);
    this.vm.$el.append(this.maxArrow);
  },
  setItems: function (items) {
    this.vm.setItems(items);
  },
  init: function () {
    console.log('gui list view init');
    // read <template> tag and interpret it as json data
    var tplData = this.el.querySelector('template');
    if (tplData) {
      var parsed = jsonic(tplData.innerHTML);

      if (parsed.length >= 0) {
        this.data.items = parsed;
      } else {
        console.error("invalid data in template must be array of objects in less strict json format (see 'jsonic')");
      }

      tplData.parentElement.removeChild(tplData);
    }

    // query for itemFactory at entity
    var itemFactoryTpl = this.el.querySelector(':nth-child(1)');
    if (itemFactoryTpl) {
      var parsed = itemFactoryTpl.outerHTML;

      if (parsed.length > 0) {
        console.log('parsed', parsed);
        this.data.itemFactory = parsed; // FIXME when update is called from setting settAttr("items",[]) the previous itemFactory is used
      } else {
        console.error('invalid itemFactory');
      }

      itemFactoryTpl.parentElement.removeChild(itemFactoryTpl);
    }

    // init the actual view model
    this.initViewModel();
  },
  initViewModel: function () {
    console.log('initViewModel');
    // remove previous vm
    if (this.vm) {
      this.vm.$el.parentElement.removeChild(this.vm.$el);
      this.vm = null;
    }

    this.vm = createListView(this.data.items, {itemFactory: this.data.itemFactory, containerFactory: this.data.containerFactory, arrowFactory: this.data.arrowFactory}, this.data.orientation, this.data.overflow);
    this.el.appendChild(this.vm.$el);
    setTimeout(() => this.addArrows(), 500);
  },
  remove () {
    this.vm.$el.removeChild(this.vm.$el);
    this.vm.$el.removeChild(this.minArrow);
    this.vm.$el.removeChild(this.maxArrow);
  }

});

// ----------------------------------
// FIXME don't use objects directly but rather use their indexes and return the items when selection changes
// have a non-intrusive listener for items changes to update vm
export function createListView (items, {itemFactory, containerFactory, arrowFactory}, direction = 'column', overflow = false, invertControls = false) {
  if (!items) {
    items = [{key: '1', value: 'hello'}, {key: '2', value: 'hello'}, {key: '3', value: 'hello'}, {
      key: '4',
      value: 'hello'
    }, {key: '5', value: 'hello'}];
  }
  if (!containerFactory) containerFactory = '<a-entity></a-entity>';
  if (!itemFactory) throw new Error('must have vue based factory string');

  // template -------------------------------------

  var el = createHTML(containerFactory);
  let btn = createHTML(itemFactory);
  el.appendChild(btn);
  el.setAttribute('ref', 'listView');

  // vue -------------------------------------

  var app = new Vue({
    el: el,

    data: {
      items: items,
      selectedIndex: -1
    },

    methods: {
      setItems: function (items) {
        this.$data.items = items;
      },
      addItem: function (item) {
        this.$data.items.push(item);
      },
      removeItem: function (item) {
        this.$data.items.splice(this.$data.items.indexOf(item), 1);
      },
      onItemClicked: function () {
        var data = this.$data.items[this.$data.selectedIndex];

        var that = this.$refs.listView.childNodes[this.$data.selectedIndex];

        console.log('onItemClicked', data, that);

        var caption = that ? that.getAttribute('value') : '-1'; // TODO improve usability of list view

        if (this.$data.selectedIndex > -1) {
          this.$el.emit('change', data);
        }
      },
      setPositionFromIndex: function (index, xMax, yMax, xScale = 1, yScale = 1) {
        let x = index % xMax;
        let y = parseInt(index / xMax);

        return '' + _.round(xScale * x, 4) + ' ' + _.round(yScale * y, 4) + ' 0';
      }
    },
    watch: {
      /* items: {
                          handler: function (val, oldVal) {
                            // TODO not watching all the time
                            // console.log('watch.items', val, oldVal);

                            //  debouncedUpdate(this);
                          },
                          deep: false // TODO might interfere with recursive objects
                        }, */
      selectedIndex: {
        handler: function (val, oldVal) {
          console.log('watch', arguments);

          var len = app.$data.items.length - 1;
          if (val > len) app.$data.selectedIndex = overflow ? 0 : len;
          if (val < 0) app.$data.selectedIndex = overflow ? len : 0;

          var _old = this.$refs.listView.childNodes[oldVal];
          var _new = this.$refs.listView.childNodes[val];

          if (_old) _old.emit('mouseleave');
          if (_new) _new.emit('mouseenter');

          if (val > -1) {
            this.onItemClicked();
          }
        }

      }

    }
  });

    // -----------------------------------------

  app.$el.addEventListener(direction == 'row' ? 'player-move-backward' : 'player-strafe-left', suppressedThrottle(function (e) {
    e.stopPropagation();

    if (e.detail.second) return;

    app.$data.selectedIndex--;
  }, 50));

  app.$el.addEventListener(direction == 'row' ? 'player-move-forward' : 'player-strafe-right', suppressedThrottle(function (e) {
    e.stopPropagation();
    if (e.detail.second) return;

    app.$data.selectedIndex++;
  }, 50));

  return app;
}
