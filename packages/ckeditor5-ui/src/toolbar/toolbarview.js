/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module ui/toolbar/toolbarview
 */

import View from '../view';
import Template from '../template';
import FocusTracker from '@ckeditor/ckeditor5-utils/src/focustracker';
import FocusCycler from '../focuscycler';
import KeystrokeHandler from '@ckeditor/ckeditor5-utils/src/keystrokehandler';
import ToolbarSeparatorView from './toolbarseparatorview';
import preventDefault from '../bindings/preventdefault.js';
import log from '@ckeditor/ckeditor5-utils/src/log';

/**
 * The toolbar view class.
 *
 * @extends module:ui/view~View
 */
export default class ToolbarView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		/**
		 * Collection of the toolbar items (like buttons).
		 *
		 * @readonly
		 * @member {module:ui/viewcollection~ViewCollection}
		 */
		this.items = this.createCollection();

		/**
		 * Tracks information about DOM focus in the list.
		 *
		 * @readonly
		 * @member {module:utils/focustracker~FocusTracker}
		 */
		this.focusTracker = new FocusTracker();

		/**
		 * Instance of the {@link module:utils/keystrokehandler~KeystrokeHandler}.
		 *
		 * @readonly
		 * @member {module:utils/keystrokehandler~KeystrokeHandler}
		 */
		this.keystrokes = new KeystrokeHandler();

		/**
		 * Helps cycling over focusable {@link #items} in the toolbar.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/focuscycler~FocusCycler}
		 */
		this._focusCycler = new FocusCycler( {
			focusables: this.items,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate toolbar items backwards using the arrow[left,up] keys.
				focusPrevious: [ 'arrowleft', 'arrowup' ],

				// Navigate toolbar items forwards using the arrow[right,down] keys.
				focusNext: [ 'arrowright', 'arrowdown' ]
			}
		} );

		this.template = new Template( {
			tag: 'div',
			attributes: {
				class: [
					'ck-toolbar'
				]
			},

			children: this.items,

			on: {
				// https://github.com/ckeditor/ckeditor5-ui/issues/206
				mousedown: preventDefault( this )
			}
		} );

		this.items.on( 'add', ( evt, item ) => {
			this.focusTracker.add( item.element );
		} );

		this.items.on( 'remove', ( evt, item ) => {
			this.focusTracker.remove( item.element );
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element );

		super.init();
	}

	/**
	 * Focuses the first focusable in {@link #items}.
	 */
	focus() {
		this._focusCycler.focusFirst();
	}

	/**
	 * A utility which expands a plain toolbar configuration into
	 * {@link module:ui/toolbar/toolbarview~ToolbarView#items} using a given component factory.
	 *
	 * @param {Array.<String>} config The toolbar items config.
	 * @param {module:ui/componentfactory~ComponentFactory} factory A factory producing toolbar items.
	 */
	fillFromConfig( config, factory ) {
		if ( !config ) {
			return;
		}

		config.map( name => {
			if ( name == '|' ) {
				this.items.add( new ToolbarSeparatorView() );
			} else if ( factory.has( name ) ) {
				this.items.add( factory.create( name ) );
			} else {
				/**
				 * There was a problem with expanding the toolbar configuration into toolbar items.
				 * The provided factory does not provide a component of such a name and because of that
				 * it has not been added to the {@link #items}.
				 *
				 * This warning usually shows up when the plugin that is supposed to register the toolbar
				 * component in the factory has not been loaded or there's a typo in the configuration
				 * of the toolbar.
				 *
				 * @error toolbarview-missing-component
				 * @param {String} name The name of the component.
				 * @param {module:ui/componentfactory~ComponentFactory} factory The factory that is missing the component.
				 */
				log.warn(
					'toolbarview-missing-component: There is no such component in the factory.',
					{ name, factory }
				);
			}
		} );
	}
}

