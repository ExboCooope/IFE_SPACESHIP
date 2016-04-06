/**
 * Created by xiexianbo on 16-3-15.
 */

function SideBar(datasource){
    this.data_source=datasource;
    this.make();
}

SideBar.prototype.make=function(){
    var a=$g("div");
    this.last_all_item=this.all_item;
    this.last_dom=this.dom;
    this.all_item=[];
    this.selected_items=[];
    this.makeDataItemLoop(this.data_source,0,null,a);
    this._selc();
    this.dom=a;
    if(this.last_dom && this.last_dom.parentNode){
        var s1= a.innerHTML;
        var s2= this.last_dom.innerHTML;
        if(s1==s2){
            this.dom=this.last_dom;
            this.all_item=this.last_all_item;
        }else {
            this.last_dom.parentNode.$ib(a, this.last_dom);
            this.last_dom.$del();
        }
    }
};

SideBar.prototype.makeDataItemLoop=function(item,rootlevel,parent,container){
    container.$ap(this.makeDataItem(item,rootlevel,parent));
    if(item.childs.length){
        var g=$g("div");
        if(item.childs.length){
            for(var i=0;i<item.childs.length;i++){
                this.makeDataItemLoop(item.childs[i],rootlevel+1,item,g);
            }
        }
        container.$ap(g);
    }
};

SideBar.prototype.makeDataItem=function(item,rootlevel,parent){
    var pid;
    if(!parent){
        pid=0;
    }else{
        for(var i=0;i<item.parents.length;i++){
            if(item.parents[i]==parent){
                pid=i;
            }
        }
    }
    if(!item.menuitem)item.menuitem=[];
    /*
    if(item.menuitem[pid]){
        var s="";
        var a=item.menuitem[pid];
        var that=this;
        for(var i=0;i<rootlevel;i++){
            //a.$Gap("div").$c("pl1");
            s=s+'<div class="pl1"></div>'
        }
       // var bs=""
       // var b= a.$Gap("div");
        s=s+"<div";
        if(parent){
            if(parent.childs[parent.childs.length-1]==item){
                //b.$c("pl3");
                s=s+' class="pl3"';
            }else{
                //b.$c("pl2");
                s=s+' class="pl2"';
            }
        }else{
            //b.$c("pl4");
            s=s+' class="pl4"';
        }

        s=s+">";

        if(item.childs.length>0){
            s=s+'<div class="plclose"></div>';
           // var c=b.$Gap("div").$c("plclose");
            //c.onclick=SideBar.f1;
        }
        s=s+'</div>';
        a.$Gap("span").$t(item.name+"").$c("plcontent");
        s=s+'<span class="plcontent">'+item.name+'</span>';

        var s2= a.innerHTML;
       // item._sidebar_dom=a;
       // this.all_item.push(a);
        return a;
    }
    */
    a=$g("div").$c("plitem");
    that=this;
    var k1=function(){
        that.all_item.$v("selected",0);
        this.item.selected=!this.item.selected;
        that._selc();
    };
    item.menuitem[pid]=a;
    a.item=item;
    a.onclick=k1;
    for(var i=0;i<rootlevel;i++){
        a.$Gap("div").$c("pl1");
    }
    var b= a.$Gap("div");
    if(parent){
        if(parent.childs[parent.childs.length-1]==item){
            b.$c("pl3");
        }else{
            b.$c("pl2");
        }
    }else{
        b.$c("pl4");
    }
    a.$Gap("span").$t(item.name+"").$c("plcontent");
    if(item.childs.length>0){
        var c=b.$Gap("div").$c("plclose");
        c.onclick=SideBar.f1;
    }
    this.all_item.push(a);
    return a;
};
SideBar.prototype._selc=function(){
    for(var i=0;i<this.all_item.length;i++){
        var t=this.all_item[i];
        if(t.item.selected){
            t.$c("plselect");
        }else{
            t.$c("plitem");
        }

    }
};

SideBar.f1=function(e){
    e.stopPropagation();
    var t=this.$P().$P();
    var cl=t.$P().$Sa();
    for(var i=0;i<cl.length;i++){
        if(cl[i]==t){
            cl[i+1].style.display="none";
            this.$c("plopen");
            this.onclick=SideBar.f2;
            return;
        }
    }
};
SideBar.f2=function(e){
    e.stopPropagation();
    var t=this.$P().$P();
    var cl=t.$P().$Sa();
    for(var i=0;i<cl.length;i++){
        if(cl[i]==t){
            cl[i+1].style.display="block";
            this.$c("plclose");
            this.onclick=SideBar.f1;
            return;
        }
    }
};
SideBar.f3=function(){

};