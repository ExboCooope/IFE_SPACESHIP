/**
 * Created by Exbo on 2016/4/5.
 */

function ETab(name,x,y,w,h,headh,dom){
    dom=dom||$g("div");
    this.dom=dom;
    dom.style.position="absolute";
    dom.style.overflow="hidden";
    dom.style.width=w+"px";
    dom.style.height=h+"px";
    dom.$c("tab_main");
    this.name=name||"";
    this.x=x;
    this.y=y;
    this.w=w;
    this.h=h;
    this.headh=h;
    this.make();
    this.lastx=x;
    this.lasty=x;
    this.lastw=x;
    this.lasth=x;
    this.min_w=100;
    this.min_h=100;
    this.refresh();
}

ETab.prototype.make=function(){
    this.head=this.dom.$Gap("div").$t(this.name).$c("tab_head").$st("cursor","move");
    var blocker=$g("div").$c("blocker");
    var start_x;
    var start_y;
    var that=this;
    this.head.onmousedown=function(e){
        e.stopPropagation();
        e.preventDefault();
        start_x=that.x- e.clientX;
        start_y= that.y-e.clientY;
        blocker.style.cursor=this.style.cursor;
        document.body.$ap(blocker);
        $sc("tab_main").$st("zIndex","2");

        that.dom.style.zIndex="3";
    };
    blocker.onmousemove=function(e){
        e.stopPropagation();
        e.preventDefault();
        that.x= e.clientX+start_x;
        that.y= e.clientY+start_y;
        that.refresh();
    };
    blocker.onmouseup=function(e){
        e.stopPropagation();
        e.preventDefault();
        this.$del();
    }
};

ETab.prototype.refresh=function(){
    this.dom.style.left=this.x+"px";
    this.dom.style.top=this.y+"px";
};



