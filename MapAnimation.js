class MapAnimation {
    constructor(item) {
        this.item = item;
        this.itemData = item.data;
        this.guid = `animation_${game.getGuid()}`;
        this.delta_time = 0;
        this.step = 1;
        this.duration = this.itemData.duration;

        this.show();
    }

    execute(delta) {
        this.delta_time += delta;
        if (this.delta_time >= this.duration) {
            document.querySelector(`.{this.guid}`).remove();
            return true;
        }
        return false;
    }

    show() {
        this.left = (this.item.x - 1) * 32;
        this.top  = (this.item.y - 1) * 32;
        if (this.itemData.width > 32) {
            this.left -= ((this.itemData.width - 32) / 2);
        }
        if (this.itemData.height > 32) {
            this.top -= ((this.itemData.height - 32) / 2);
        }
        const html = `
            <div class="${this.guid} animation-style absolute" style="background-image:url('${this.itemData}'); z-index:250; left:${this.left}px; top:${this.top}px; width:${this.itemData.width}px; height:${this.itemData.height}px;"></div>
        `;
        document.getElementById(map.container).appendChild(fromHTML(html));
    }
}
