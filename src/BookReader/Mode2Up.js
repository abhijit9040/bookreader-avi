// @ts-check
import { Mode2UpLit } from './Mode2UpLit.js';
import { DragScrollable } from './DragScrollable.js';
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

export class Mode2Up {
  name = '2up';

  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
    this.mode2UpLit = new Mode2UpLit(bookModel, br);
    this.mode2UpLit.flipSpeed = br.flipSpeed;

    /** @private */
    this.$el = $(this.mode2UpLit)
      .attr('autoFit', this.br.options.twoPage.autofit)
      // We CANNOT use `br-mode-2up` as a class, because it's the same
      // as the name of the web component, and the webcomponents polyfill
      // uses the name of component as a class for style scoping 😒
      .addClass('br-mode-2up__root BRmode2up');

    /** Has mode2up ever been rendered before? */
    this.everShown = false;
  }

  /**
   * This is called when we switch into this mode
   */
  prepare() {
    const startLeaf = this.br.currentIndex();
    this.br.refs.$brContainer
      .empty()
      .css({ overflow: 'hidden' })
      .append(this.$el);
    this.mode2UpLit.style.opacity = '0';

    // Need this in a setTimeout so that it happens after the browser has _actually_
    // appended the element to the DOM
    setTimeout(async () => {
      if (!this.everShown) {
        this.mode2UpLit.initFirstRender(startLeaf);
        this.everShown = true;
        this.mode2UpLit.requestUpdate();
        await this.mode2UpLit.updateComplete;

        new DragScrollable(this.mode2UpLit, {
          preventDefault: true,
          dragSelector: '.br-mode-2up__book',
          // Only handle mouse events; let browser/HammerJS handle touch
          dragstart: 'mousedown',
          dragcontinue: 'mousemove',
          dragend: 'mouseup',
        });
      } else {
        await this.mode2UpLit.jumpToIndex(startLeaf, { smooth: false });
        this.resizePageView();
      }
      this.mode2UpLit.style.opacity = '1';
    });
    this.br.updateBrClasses();
  }

  /**
   * BREAKING CHANGE: No longer supports pageX/pageY
   * @param {PageIndex} index
   * @param {number} [pageX] x position on the page (in pixels) to center on
   * @param {number} [pageY] y position on the page (in pixels) to center on
   * @param {boolean} [noAnimate]
   */
  jumpToIndex(index, pageX, pageY, noAnimate) {
    this.mode2UpLit.jumpToIndex(index);
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    switch (direction) {
    case 'in':
      this.mode2UpLit.zoomIn();
      break;
    case 'out':
      this.mode2UpLit.zoomOut();
      break;
    default:
      console.error(`Unsupported direction: ${direction}`);
    }
  }

  resizePageView() {
    this.mode2UpLit.htmlDimensionsCacher.updateClientSizes();
    if (this.mode2UpLit.scale < this.mode2UpLit.initialScale && this.mode2UpLit.autoFit == 'none') {
      this.mode2UpLit.autoFit = 'auto';
    }
    if (this.mode2UpLit.autoFit != 'none') {
      this.mode2UpLit.resizeViaAutofit();
    }
    this.mode2UpLit.recenter();
  }
}
