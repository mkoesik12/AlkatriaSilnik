class MapEffect {

    constructor(item) {
        this.data       = item;
        this.guid       = game.getGuid();
        this.delta_time = 0;
        this.step       = 1;
        this.el         = undefined;

        this.show();
    }

    execute(delta) {
        this.delta_time += delta;
        this.step        = (this.delta_time / 18);

        this.move();

        if (this.step >= 18) {
            if (this.el != undefined) {
                this.el.remove();
            } else if ($('.' + this.guid).length > 0) {
                $('.' + this.guid).remove();
            }
            return true;
        }

        return false;
    }

    show() {
        var el;

        if (this.data.from) {
            el = this.data.from;
        } else {
            if (this.data.attacker == player.id) {
                el = '#my-character';
            } else {
                el = '#player_'+this.data.attacker;
            }//end if
        }

        if (this.data.to) {
            if (this.data.type == 1 && parseInt(this.data.to) > 0) {
                this.target = '.player_'+this.data.to;
            } else {
                this.target = this.data.to;
            }
        } else {
            this.target = '#monster_'+this.data.id;
        }

        if ($(this.target).length < 1 || $(el).length < 1) {
            return;
        }

        var offsetOne = $(el);
        var offsetTwo = $(this.target);

        this.height       = offsetOne.height();
        this.width        = offsetOne.width();
        this.heightTarget = offsetTwo.height();
        this.widthTarget  = offsetTwo.width();

        var mapLeft   = - $('#'+map.container).position().left;
        var mapTop    = - $('#'+map.container).position().top;

        var x = (offsetOne.offset().left + ((this.width - 32) / 2) + mapLeft);
        var y = (offsetOne.offset().top + ((this.height - 32) / 2) + mapTop);
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
