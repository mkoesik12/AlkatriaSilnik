class MapEffect {
    constructor(item) {
        this.player = item;
        this.guid = game.getGuid();
        this.delta_time = 0;
        this.step = 1;
        this.el = undefined;

        this.show();
    }

    execute(delta) {
        this.delta_time += delta;
        this.step = (this.delta_time / 18);
        
        this.move();
        
        if (this.step >= 18) {
            if (this.el != undefined) {
                this.el.remove();
            } else if (document.querySelector(`.${this.guid}`).length > 0) {
                document.querySelector(`.${this.guid}`).remove();
            }
            return true;
        }
        return false;
    }

    show() {
        if (this.item.from) {
            this.el = this.player.from;
        } else {
            this.player.attacker === player.id) ? this.el = "#my-character" : this.el = `#player_${this.player.attacker}`;
        }

        if (this.player.to) {
            this.data.type === 1 && parseInt(this.data.to) > 0 ? this.target = `.player_${this.data.to}` : this.target = this.data.to;
        } else {
            this.target = `#monster_${this.data.id}`;
        }

        if (document.querySelector(this.target).length < 1 || document.querySelector(this.el).length < 1) return;

        const offsetOne = document.querySelector(this.el).getBoundingClientRect();
        const offsetTwo = document.querySelector(this.target).getBoundingClientRect();

        this.height = offsetOne.height;
        this.width = offsetOne.width;
        this.heightTarget = offsetTwo.height;
        this.widthTarget = offsetTwo.width;

        const mapLeft = -document.querySelector(`#${map.container}`).left;
        const mapTop = -document.querySelector(`#${map.container}`).top;

        const x = (offsetOne.left + ((this.width - 32) / 2) + mapLeft);
        const y = (offsetOne.top + ((this.height - 32) / 2) + mapTop);
        this.top  = y;
        this.left = x;

        if (y < 1 || x < 1) {
            return;
        }

        var toX = (offsetTwo.offset().left + ((this.widthTarget - 32) / 2) + mapLeft);
        var toY = (offsetTwo.offset().top + ((this.heightTarget - 32) / 2) + mapTop);

        if (this.data.ammo != undefined) {
            var deg       = angle(x, y, toX, toY);
            var transform = '-webkit-transform: rotate('+deg+'deg); -moz-transform: rotate('+deg+'deg);-ms-transform: rotate('+deg+'deg);-o-transform: rotate('+deg+'deg);transform: rotate('+deg+'deg);';

            $('#'+map.container).append('<div class="'+this.guid+' item-animation" style="z-index: 200; background: url(/templates/client/default/images/items/'+this.data.ammo+'.png); '+transform+' left: '+x+'px; top: '+y+'px;"></div>');
        } else if (this.data.spell) {
            $('#'+map.container).append('<div class="'+this.guid+' animation-1" style="background: url(/assets/spells/animation_'+this.data.spell+'.gif); left: '+x+'px; top: '+y+'px;"></div>');
        } else {
            $('#'+map.container).append('<div class="'+this.guid+' item-animation" style="z-index: 200; background: url(/assets/attacks/'+this.data.attack_effect+'.gif); left: '+x+'px; top: '+y+'px;"></div>');
        }//end if

        this.el = $('.'+this.guid);
        this.move();
    }

    move() {
        if (this.el == undefined || $(this.target).length < 1) {
            return;
        }

        var mapLeft = - $('#'+map.container).position().left;
        var mapTop  = - $('#'+map.container).position().top;
        var target = $(this.target);

        if (target.length < 1) {
            return;
        }

        var offset = target.offset();

        if (offset.left < 1 || offset.top < 1) {
            return;
        }

        var x = this.left - (offset.left + ((this.widthTarget - 32) / 2) + mapLeft);
        var y = this.top - (offset.top + ((this.heightTarget - 32) / 2) + mapTop);

        var x = (- x) / 20;
        var y = (- y) / 20;

        var left = this.left + (x * this.step);
        var top  = this.top + (y * this.step);

        if (this.data.ammo != undefined) {
            //console.log('recalculate deg');
        }//end if

        this.el.css('left', left + 'px');
        this.el.css('top', top + 'px');
    }

    rotate() {

    }

    rotateAround() {
        
    }

}
