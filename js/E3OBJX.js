//一个脚本环境，面向对象父子关系，可以实现非timeout下，一个大对象中所有小对象共同参与一个事件，同时根据各自设置的优先级排序执行
//主要适用于回合制游戏中复杂因果关系的结算。
//可以使用脚本在敌人身上注入一个对象影响敌人的各种计算。
//同时可以实现系统分离，比如设计一个特殊buff可以直接写在技能的脚本中，实现改变游戏结算方式的功能，而不需要改游戏系统脚本

//2016.3.31 E3_OBJ X version 简化了函数调用，增强了数据搜星能力，更适合面向自然对象编程
//2016.4.5 增加了全局监听、Goto和协线程

//由于这个库创建比较早，风格以大写字母开头为函数，故后续补充也保持这个风格

//数组判断
if(!isArray)var isArray=function(a){
	return Object.prototype.toString.call(a)==='[object Array]';
};

//内部用，启动函数所需的环境，每次调用产生一个新的
function E3_Evo(funcname){
    var that=this;
	this.exelist=[];
	this.value={};
    this.overcome=[];
    this.value.Overcome=function(a){
        that.overcome.push(a);
    }
	this.funcname=funcname;

}

//先插入在函数本体中定义的代码
E3_Evo.prototype.CompileS=function(f){
	var	that=this.exelist;
	//console.log(f);
	if(!f)return this;
	for(var i=0;i<f.length;i++){
		if(f[i]!=undefined){
		if(!that[i])that[i]=[];
		that[i].push({script:f[i]});
		}
	}
	return this;
};

//再插入从对象堆中获得的代码
E3_Evo.prototype.Compile=function(a){
	var	that=this.exelist;
	var funcname=this.funcname;
	if(!a)return this;
	if(!a.E3_Data)return this;
	var e=function(c){
		if(c.E3_Data.onlist[funcname]){
			for(var i=0;i<c.E3_Data.onlist[funcname].length;i++){
                var t=c.E3_Data.onlist[funcname][i];
                if(t) {
                    if (!that[i])that[i] = [];
                    //t.Obj = c;
                    that[i].push({script:t,obj:c});
                }
			}
		}
        if(c.E3_Data.onalllist){
            for(i=0;i<c.E3_Data.onalllist.length;i++){
                t=c.E3_Data.onalllist[i];
                if(t) {
                    if (!that[i])that[i] = [];
                    //t.Obj = c;
                    that[i].push({script:t,obj:c});
                }
            }
        }
	};
	a.DoIn(e);
	//console.log(this);
	return this;
};

E3_Evo._goto=function(id){
    this._goto=id;
};
E3_Evo._yield=function(id){
    if(id===undefined)id=1;
    this._yield=id;
};


//运行代码
E3_Evo.prototype.Run=function(){
	var i;
	var self=this.value;
    self.FuncName=this.funcname;
    self.GoTo=E3_Evo._goto;
    self.Yield=E3_Evo._yield;
	var that=this.exelist;
	for(i=0;i<that.length;i++){
		if(that[i]){
			for(var j=0;that[i]&&j<that[i].length;j++){
				if(that[i][j]){
                    var flg=1;
                    for(var k= 0;k< this.overcome.length;k++){
                        if(this.overcome[k](that[i][j].Obj))flg=0;
                    }
                    if(flg)that[i][j].script.call(that[i][j].obj||self.Caller,self);
                    if(self._yield>0){  //处理挂起
                        self._yield--;
                        self.Caller.E3_Data.yieldList.push(this);
                        this.i=i;
                        this.j=j+1;
                        return this;
                    }
                    if(self._goto!=undefined){ //处理跳转
                        i=self._goto;
                        j=0;
                        delete self._goto;
                    }
                }
			}
		}
	}
	return this;
};

//恢复环境
E3_Evo.prototype.Resume=function(){
    var i;
    var self=this.value;
    //self.goto=E3_Evo._goto;
    //self.yield=E3_Evo._yield;
    if(self._yield>0){
        self._yield--;
        self.Caller.E3_Data.yieldList.push(this);
        return self;
    }
    var that=this.exelist;
    for(i=this.i;i<that.length;i++){
        this.i=0;
        if(that[i]){
            var tj=this.j;
            this.j=0;
            for(var j=tj;that[i]&&j<that[i].length;j++){

                if(that[i][j]){
                    var flg=1;
                    for(var k= 0;k< this.overcome.length;k++){
                        if(this.overcome[k](that[i][j].Obj))flg=0;
                    }
                    if(flg)that[i][j].script.call(that[i][j].obj||self.Caller,self);
                    if(self._yield>0){
                        self._yield--;
                        this.i=i;
                        this.j=j+1;
                        self.Caller.E3_Data.yieldList.push(this);
                        return self;
                    }
                    if(self._goto!=undefined){
                        i=self._goto;
                        j=0;
                        delete self._goto;
                    }
                }
            }
        }
    }
    return this;
};

//创建函数，需要函数名，（可选）形参（表）、（可选）返回（表）、（可选）本体代码（表）
//可选参数支持 空、单个值、数组
//形参表["arg1","arg2"]可由定义On中的function(e),e.arg1,e.arg2获得
//返回值为连续数组，返回表为["rt1","rt2"]，则Call的返回值为[rt1,rt2]

//2016.3.31
//删除了参数表和返回表，改为由call指定参数，并返回全部环境
function E3_Function(funcname,localfunc){
	this.name=funcname;
    E3_Function[funcname]=this;
	if(!isArray(localfunc)){
		this.localfunc=[];
		this.localfunc[0]=localfunc;
	}else{
		this.localfunc=localfunc;
	}
}


E3_Function.prototype.Call=function(a,argv){
	var t=new E3_Evo(this.name);
	t.value.Caller=a;
	for(var i in argv){
        t.value[i]=argv[i];
    }
	t.CompileS(this.localfunc).Compile(a).Run();
	return t.value;
};

//主类 E3_Object，可以接受一个名称和其父对象
//名称主要用于InLine方法展示对象
//还可以使用E3_Object.make加强一个现有对象
function E3_Object(name,base){
	var a={};
	a.parent=this;
	a.child=[];
	a.value={};
	a.host={};
	a.onlist={};
    a.yieldList=[];
    if(name)this.name=name;
	this.E3_Data=a;
    if(base)base.SHost(this);
    this.On("yield",0,E3_Object._yieldfunction);
}
E3_Object._yieldfunction=function(e){
    var t= this.E3_Data.yieldList;
    this.E3_Data.yieldList=[];
    for(var i=0;i< t.length;i++){
        t[i].Resume();
    }
};

//将一个现有对象加工为E3_Object，overide指定是否强制应用E3_Object的所有方法
E3_Object.make=function (e,name,base,overide){
    if(overide===undefined)overide=true;
    for(var i in E3_Object.prototype){
        if(overide || !e[i]){
            e[i]=E3_Object.prototype[i];
        }
    }
    E3_Object.call(e,name,base);
    return e;
};
//对象注入
E3_Object.prototype.SHost=function(a){
	if(!a || !a.E3_Data)return this;
	if(a.E3_Data.parent!=a){
		for(var i in a.E3_Data.parent.E3_Data.child){
			if(a.E3_Data.parent.E3_Data.child[i]==a){
				delete a.E3_Data.parent.E3_Data.child[i];
			}
		}
	}
	a.E3_Data.parent=this;
	for(var i=0;i<=this.E3_Data.child.length;i++){
		if(!this.E3_Data.child[i]){
			this.E3_Data.child[i]=a;
			return this;
		}
	}
	return this;
};
//在B之前插入节点
E3_Object.prototype.IHost=function(a,b){
    if(!a || !a.E3_Data)return this;
    if(!b){
        a.E3_Data.parent=this;
        this.E3_Data.child.push(a);
    }else{
        var k=this.E3_Data.child;
        this.E3_Data.child=[];
        for(var i=0;i< k.length;i++){
            if(k[i]) {
                if (k[i] == b) {
                    this.E3_Data.child.push(a);
                    a.E3_Data.parent = this;
                }
                this.E3_Data.child.push(k[i]);
            }
        }
    }
    return this;
};

//对象解除
E3_Object.prototype.UHost=function(a){
	a.E3_Data.parent=a;
	for(var i in this.E3_Data.child){
		if(this.E3_Data.child[i]==a){
			delete this.E3_Data.child[i];
		}
	}
	return this;
};

//删除自己与父节点的链接
E3_Object.prototype.Remove=function(){
    var a=this;
    if(a.E3_Data.parent!=a){
        a.E3_Data.parent.UHost(a);
    }
    return this;
};

//对象覆盖
E3_Object.prototype.Host=function(a,b){
	var p=this.E3_Data;
	if(p.host[a]){
		if(isArray(p.host[a])){
			for(var i=0;i< p.host[a].length;i++){
                if(p.host[a][i]) {
                    this.UHost(p.host[a][i]);
                }
			}
		}else{
			this.UHost(p.host[a]);
		}
	}
	
	if(isArray(b)){
		for(var i=0;i< b.length;i++){
            if(b[i])this.SHost(b[i]);
		}
	}else{
		this.SHost(b);
	}
	p.host[a]=b;
	return this;
};

//获取根节点 可以传入一个函数判断
E3_Object.prototype.Root=function(e){
	var a=this;
	var b;
	while(a.E3_Data.parent!=a && (e?e(a):1)){
		b=a;
		a=a.E3_Data.parent;
	}
	return e?b:a;
};

//在节点中执行
E3_Object.prototype.DoIn=function(action){
	action(this);
	for(var i=0;i< this.E3_Data.child.length;i++){
		if(this.E3_Data.child[i])this.E3_Data.child[i].DoIn(action);
	}
	return this;
};

//该节点是否拥有节点a或者满足属性 a(节点)的节点，返回节点
E3_Object.prototype.Has=function(a){
    if(a instanceof Function){
        if(a(this))return this;
    }
	if(a==this)return this;
    for(var i=0;i< this.E3_Data.child.length;i++){
        if(this.E3_Data.child[i]){
            var t=this.E3_Data.child[i].Has(a)
            if(t)return t;
        }
	}
	return null;
};
//在funcname过程的指定位置pass(自然数)，设置处理函数
//一个节点在一个位置只能设置一个处理函数，该节点设置空函数则会取消已经设置的函数
//如果 !funcname ，则该函数会监听所有过程，可以通过func(e) e.FuncName获取过程名
//内建变量：   e.
// Caller:调用者（E3_Object） FuncName:过程名 this:将指向当前的对象
// e会在所有处理函数中传递，并最终返回给Call
E3_Object.prototype.On=function(funcname,pass,func){
    if(!funcname){
        if(!this.E3_Data.onalllist)this.E3_Data.onalllist=[];
        this.E3_Data.onalllist[pass]=func;
        return this;
    }
	if(!this.E3_Data.onlist[funcname])this.E3_Data.onlist[funcname]=[];
	this.E3_Data.onlist[funcname][pass]=func;
	return this;
};
//组合功能
//满足 e[subj] has this 条件下运行函数func
//用途？比如战场上发生一次攻击结算，传入了攻击者和被攻击者以及技能，单位可以通过OnIn执行自己攻击或者防御的脚本，技能也可以知道自己是不是被使用的技能
E3_Object.prototype.OnIn=function(funcname,pass,subj,func){
	var that=this;
	var a=function (e){
		if(e[subj].Has(that))func.call(this,e);
	};
	this.On(funcname,pass,a);
	return this;
};

//在当前对象上执行一个过程名为funcname的过程，可以传入初始参数paralist {}
//paralist的各项属性会被浅拷贝进e
E3_Object.prototype.Call=function(funcname,paralist){
	var that=this;
    var func=E3_Function[funcname];
    if(!func)func=new E3_Function(funcname);
	return func.Call(that,paralist);
};


//代替常用的this.root().Call
E3_Object.prototype.Emit=function(funcname,paralist){
    return this.Root().Call(funcname,paralist);
};

//定位一个属性
E3_Object.prototype.Locate=function(b){
    if(!(this.E3_Data.value[b]===undefined))return this;
    var a=this;
    while(a.E3_Data.parent!=a){
        //console.log(a);
        if(!(a.E3_Data.value[b]===undefined))return a;
        a=a.E3_Data.parent;
    }
    if(!(a.E3_Data.value[b]===undefined))return a;
    var pool=[];
    this.DoIn(function(e){
        if(!(e.E3_Data.value[b]===undefined))pool.push(e);
    });
    if(pool.length){
        return pool[0];
    }
    return null;
};

//获取该节点附近b属性的值
E3_Object.prototype.Ev=function(b){
	//console.log(this,b);
	var a=this.Locate(b);
    if(a)return a.E3_Data.value[b];
	return undefined;
};
//设置该节点附近b属性的值
E3_Object.prototype.SetEv=function(b,c){
    var a=this.Locate(b);
    if(a){
        a.E3_Data.value[b]=c;
    }else{
        this.E3_Data.value[b]=c;
    }

};
//设置该节点的属性
E3_Object.prototype.Var=function(b,c){
    if(c===undefined)c=null;
	if(isArray(b)){
		if(isArray(c)){
			for(var i=0;i< b.length;i++){
				this.E3_Data.value[b[i]]=c[i];
			}
		}else{
			for(var  i=0;i< b.length;i++){
				this.E3_Data.value[b[i]]=c;
			}
		}
	}else{
		this.E3_Data.value[b]=c;
	}
	return this;
};
//用一个字符串描述该对象
E3_Object.prototype.InLine=function(level){
    var s=this.name||"";
    var flg=0;
    if(level>=1){

        if(this.E3_Data.value){
            for(var i in this.E3_Data.value){
                if(flg==0){
                    flg=1;
                    s=s+"(";
                }else if(flg==1){
                    s=s+",";
                }
                s=s+i+":"+this.E3_Data.value[i];
            }
            if(flg)s=s+")";
        }
    }
    flg=0;
    if(this.E3_Data.child.length){
        for(var i=0;i<this.E3_Data.child.length;i++){
            if(this.E3_Data.child[i]){
                if(flg==0){
                    flg=1;
                    s=s+"{";
                }else if(flg==1){
                    s=s+",";
                }
                s=s+this.E3_Data.child[i].InLine(level);
            }

        }
        if(flg)s=s+"}";
    }
    return s;
};


//未实用
E3_Object.prototype.Overcome=function(a){

};

//将自己和子节点加工成DataSource的格式
E3_Object.prototype.DSMakeChilds=function(){
    if(this.E3_Data.parent!=this){
        this.parents=[this.E3_Data.parent];
    }else{
        this.parents=[];
    }
    this.childs=[];
    if(this.E3_Data.child.length){
        for(var i=0;i<this.E3_Data.child.length;i++){
            if(this.E3_Data.child[i]){
                this.childs.push(this.E3_Data.child[i]);
                this.E3_Data.child[i].DSMakeChilds();
            }
        }
    }
};