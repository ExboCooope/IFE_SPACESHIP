/**
 * @module E3DC/DataSource
 * @author xiexb
 * 简易的数据源，有parent/child功能，支持多个parent或child
 */

//define(function(require){

var DataSource = function(options,parents) {
    options=options||{};
    this.type=options.type;
    this.parents=[];
    this.childs=[];
    this.data=options.data;
    for(var i in DataSource.Options){
        if(options[i]){
            this[i]=options[i];
        }
    }
    if(parents){
        if(parents instanceof Array){
            for(i=0;i<parents.length;i++){
                if(parents[i]){
                    this.addParent(parents[i]);
                }
            }
        }else{
            this.addParent(parents);
        }
    }
};

DataSource.Options={
    name:"Name of the item",
    disabled:"Disable menu item",
    icon:"Icon source of the item 20*20px",
    onclick: "Called when item is clicked",
    short_cut_name: "Short cut description text",
    fileinput: "dom element of input type file"
};

DataSource.prototype.addParent=function(parent){
    if(this.hasParent(parent))return false;
    this.parents.push(parent);
    parent.childs.push(this);
    return true;
};
DataSource.prototype.hasParent=function(parent){
    for(var i in this.parents){
        if(this.parents[i]==parent && parent){
            return true;
        }
    }
    return false;
};

DataSource.generateDataSourceTest=function(e){
    var a=[];
    var i=0;
    var g=0;
    var q=function(k,p){
        var t=new DataSource();
        if( !k || !(k instanceof Array)){
            t.name= k||("data "+i);
            t.id=i+"";
            if(p)t.addParent(p);
            i++;
            a.push(t);
        }else{
            t.name= "folder "+g;
            t.id=g+"f";
            if(p)t.addParent(p);
            g++;
            a.push(t);
            var l= k.length;
            if(l==0)l=1;
            for(var j=0;j<l;j++){
                q(k[j],t);
            }
        }
    };
    q(e);
    return a;
};

DataSource.prototype.toE3ObjectX=function(){
    if(!E3_Object)return null;
    E3_Object.call(this);
    for(var i in E3_Object.prototype){
        this[i]=E3_Object.prototype[i];
    }
    for(var j=0;j<this.childs.length;j++){
        this.childs[i].toE3ObjectX();
        this.SHost(this.childs[i]);
    }
    return this;
};

DataSource.CreateFromObjectStatic=function(object){

};
    //return DataSource;
//});
