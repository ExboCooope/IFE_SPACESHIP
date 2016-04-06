/**
 * @module E3DC/DomBuilder
 * @author xiexb
 * 简易的dom生成器
 * 本人不喜欢用现成的库，所以这个是个简易JQuery
 * 这个库会增强Array对象，for in慎用
 */

var $$statePool=[]; //选择链
var $$domFunctions={};//临时对象，用于同时给HTMLElement和Array设置方法

//在当前对象内追加一个dom
$$domFunctions.$ap=function(e){
    this.appendChild(e);
    return this;
};

//在当前对象的某个对象前插入一个dom
$$domFunctions.$ib=function(e,t){
    this.insertBefore(e,t);
    return this;
};

//在指定位置插入
$$domFunctions.$ia=function(e,t){
    this.insertBefore(e,this.childNodes[t]);
    return this;
};

//在当前对象首位置插入一个dom
$$domFunctions.$is=function(e,t){
    this.insertBefore(e,this.childNodes[0]);
    return this;
};

//设置对象的style属性
$$domFunctions.$st=function(n,v){
    this.style[n]=v+"";
    return this;
};

//将当前对象添加至另一个对象末尾
$$domFunctions.$apa=function(e){
    e.appendChild(this);
    return this;
};
//写文本
$$domFunctions.$t=function(e){
    this.innerHTML=e;
    return this;
};
//追加文本
$$domFunctions.$ta=function(e){
    this.innerHTML=this.innerHTML+e;
    return this;
};
//设置属性
$$domFunctions.$v=function(name,e){
    this[name]=e;
    return this;
};
//todo 选择当前对象内的对象
$$domFunctions.$s=function(pos,id,className){
};

//设置类型名
$$domFunctions.$c=function(e){
    this.className=e;
    return this;
};
//设置id
$$domFunctions.$i=function(e){
    this.id=e;
    return this;
};

$$domFunctions.$del=function(){
    if(this.parentNode){
        this.parentNode.removeChild(this);
    }
    return this;
};

//创建一个新的对象，并添加至当前对象内，同时改变为选择新的对象
$$domFunctions.$Gap=function(){
    return $g.apply(this,arguments).$apa(this);
};
//选择父节点
$$domFunctions.$P=function(){
    return this.parentNode;
};
//创建一个新的对象，并添加至当前对象内
$$domFunctions.$gap=function(){
    $g.apply(this,arguments).$apa(this);
    return this;
};
//选择所有的子节点
$$domFunctions.$Sa=function(){
    return _node2array(this.childNodes);
};

$$domFunctions.$run=function(name,parameter){
    this[name].apply(this,parameter);
    return this;
};

//全局函数，创建对象
function $g(type){
    var t=document.createElement(type);
    if(arguments.length>1){
        for(var i=0;i<$g.containerLabels.length;i++){
            if(type==$g.containerLabels[i]){
                for(var j=1;j<arguments.length;j++){
                    t.$ap(arguments[j]);
                }
                return t;
            }
        }
        for(i=0;i<$g.innerLabels.length;i++){
            if(type==$g.innerLabels[i]){
                for(j=1;j<arguments.length;j++){
                    t.$ap(arguments[j]);
                }
                return t;
            }
        }
    }
    return t;
}

//全局函数，选择id
function $si(id){
    return document.getElementById(id);
}


//全局函数，选择类型名
function $sc(classname){
    var t=document.getElementsByClassName(classname);
    return _node2array(t);
}

//将NodeList转换为Array
function _node2array(node){
    var t=node;
    if(t){
        if(t.length){
            var a=[];
            for(var i in t){
                if((-(-i))+""==i){
                    a.push(t[i]);
                }
            }
            return a;
        }
        return [];
    }
    return [];
}


$g.innerLabels=[];
$g.containerLabels=[];

//不重复的push
Array.prototype.pushB=function(e){
    for(var i=0;i<this.length;i++){
        if(this[i]==e)return;
    }
    this.push(e);
};

//设置全局函数
/*   window.$g=$g;
 window.$sc=$sc;
 window.$si=$si;*/

//兼容push入一个array的push
Array.prototype.pushA=function(e){
    if(e instanceof Array){
        for(var i in e){
            this.pushB(e[i]);
        }
    }else{
        this.pushB(e);
    }
    return this;
};

//属性赋值器
(function(){
    for(var i in $$domFunctions){
        (function(){//用于保存i
            var q=$$domFunctions[i];
            var _i=i;
            HTMLElement.prototype[i]=function(){
                return q.apply(this,arguments);
            };
            Array.prototype[i]=function(){
                var rt=[];
                for(var j=0;j<this.length;j++){
                    if(this[j][_i]){
                        rt.pushA(this[j][_i].apply(this[j],arguments));
                    }
                }
                return rt;
            }
        }());
    }
})();

//以下是特殊方法

//压入选择链
HTMLElement.prototype.$push=function(){
    $$statePool.push(this);
};
//弹出选择链
HTMLElement.prototype.$pop=function(){
    return $$statePool.pop();
};
Array.prototype.$pop=HTMLElement.prototype.$pop;
Array.prototype.$push=HTMLElement.prototype.$push;

//保存至选择链的指定位置
HTMLElement.prototype.$store=function(position){
    $$statePool[position]=this;
    return this;
};
Array.prototype.$store=HTMLElement.prototype.$store;
//从指定位置读取
HTMLElement.prototype.$restore=function(position){
    return $$statePool[position];
};
Array.prototype.$restore=HTMLElement.prototype.$restore;
//删除指定位置
HTMLElement.prototype.$delstore=function(position){
    delete $$statePool[position];
    return this;
};
Array.prototype.$delstore=HTMLElement.prototype.$delstore;
HTMLElement.prototype.setStatic=function(){
    this.addEventListener("selectstart",HTMLElement.preventSelectFunction,true);
    this.addEventListener("dragstart",HTMLElement.preventSelectFunction,true);
    this.style.cursor="default";
};
HTMLElement.preventSelectFunction=function(e){
    e.preventDefault();
    return false;
};