class MapAnimation {

    constructor(item) {
        this.data       = item;
        this.guid       = 'animation_'+game.getGuid();
        this.delta_time = 0;
        this.step       = 1;
        this.duration   = item.data.duration;

        this.show();
    }

    execute(delta) {
        this.delta_time += delta;

        if (this.delta_time >= this.duration) {
            $('.'+this.guid).remove();
            return true;
        }

        return false;
    }

    show() {
        this.left = (this.data.x - 1) * 32;
        this.top  = (this.data.y - 1) * 32;

        if (this.data.data.width > 32) {
            this.left -= ((this.data.data.width - 32) / 2);
        }//end if

        if (this.data.data.height > 32) {
            this.top -= ((this.data.data.height - 32) / 2);
        }//end if

        var bg    = 'background-image:url('+this.data.data.path+'?'+this.guid+');';
        var html  = '<div class="'+this.guid+' animation-style absolute" style="'+bg+' z-index: 250; left: '+this.left+'px; top: '+this.top+'px; width: '+this.data.data.width+'px; height: '+this.data.data.height+'px;;"></div>';
        document.getElementById(map.container).appendChild(fromHTML(html));

        this.el = document.getElementById(this.guid);
    }

    rotate() {

    }

    rotateAround() {
        
    }

}
