//一个脚本环境，面向对象父子关系，可以实现非timeout下，一个大对象中所有小对象共同参与一个事件，同时根据各自设置的优先级排序执行
//主要适用于回合制游戏中复杂因果关系的结算。
//可以使用脚本在敌人身上注入一个对象影响敌人的各种计算。
//同时可以实现系统分离，比如设计一个特殊buff可以直接写在技能的脚本中，实现改变游戏结算方式的功能，不需要改游戏系统脚本


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
	for(var i in f){
	
		if(f[i]!=undefined){
		if(!that[i])that[i]=[];
	//	console.log(f[i]);
		that[i].push(f[i]);
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
			for(var i in c.E3_Data.onlist[funcname]){
				if(!that[i])that[i]=[];
                var t=c.E3_Data.onlist[funcname][i];
                t.Obj=c;
				that[i].push(t);
			}
		}
	}
	a.DoIn(e);
	//console.log(this);
	return this;
};

//运行代码
E3_Evo.prototype.Run=function(){
	var i;
	var self=this.value;
	var that=this.exelist;
	for(i=0;i<that.length;i++){
		if(that[i]){
			for(var j=0;j<that[i].length;j++){		
				if(that[i][j]){
                    var flg=1;
                    for(var k in this.overcome){
                        if(this.overcome[k](that[i][j].Obj))flg=0;
                    }
                    if(flg)that[i][j](self);
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
function E3_Function(funcname,vvarlist,rtlist,localfunc){
	this.name=funcname;
	if(!isArray(vvarlist)){
		this.vvarlist=[];
		this.vvarlist[0]=vvarlist;
	}else{
		this.vvarlist=vvarlist;
	}
	if(!isArray(rtlist)){
		this.rtlist=[];
		this.rtlist[0]=rtlist;
	}else{
		this.rtlist=rtlist;
	}
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
	var t2=[];
	if(!isArray(argv)){
		t2[0]=argv;
	}else{
		t2=argv;
	}
	for(var i=0;i<t2.length;i++){
		if(this.vvarlist[i])t.value[this.vvarlist[i]]=t2[i];
	}
	t.CompileS(this.localfunc).Compile(a).Run();
	var rt=[];
	for(var i=0;i<this.rtlist.length;i++){
		if(this.rtlist[i])rt[i]=t.value[this.rtlist[i]];
	}
	return rt;
};


function E3_Object(){
	var a={};
	a.parent=this;
	a.child=[];
	a.value={};
	a.host={};
	a.onlist={};
	this.E3_Data=a;
}

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

//对象覆盖
E3_Object.prototype.Host=function(a,b){
	var p=this.E3_Data;
	if(p.host[a]){
		if(isArray(p.host[a])){
			for(var i in p.host[a]){
				this.UHost(p.host[a][i]);
			}
		}else{
			this.UHost(p.host[a]);
		}
	}
	
	if(isArray(b)){
		for(var i in b){
			this.SHost(b[i]);
		}
	}else{
		this.SHost(b);
	}
	p.host[a]=b;
	return this;
};


E3_Object.prototype.Root=function(e){
	var a=this;
	var b;
	while(a.E3_Data.parent!=a && (e?e(a):1)){
		b=a;
		a=a.E3_Data.parent;
	}
	return e?b:a;
};

E3_Object.prototype.DoIn=function(action){
	action(this);
	for(var i in this.E3_Data.child){
		this.E3_Data.child[i].DoIn(action);
	}
	return this;
};

E3_Object.prototype.Has=function(a){

	if(a==this)return 1;
	for(var i in this.E3_Data.child){
		if(this.E3_Data.child[i].Has(a))return 1;
	}
	
	return 0;
};

E3_Object.prototype.On=function(funcname,pass,func){
	if(!this.E3_Data.onlist[funcname])this.E3_Data.onlist[funcname]=[];
	this.E3_Data.onlist[funcname][pass]=func;
	return this;
};

E3_Object.prototype.OnIn=function(funcname,pass,subj,func){
	var that=this;
	var a=function (e){
		if(e[subj].Has(that))func(e);
	};
	this.On(funcname,pass,a);
	return this;
};


E3_Object.prototype.Call=function(func,paralist){
	var that=this;
	return func.Call(that,paralist);
};



E3_Object.prototype.Ev=function(b){
	//console.log(this,b);
	var a=this;
	while(a.E3_Data.parent!=a){
		//console.log(a);
		if(a.E3_Data.value[b]!=undefined)return a.E3_Data.value[b];
		a=a.E3_Data.parent;
	}
	if(a.E3_Data.value[b]!=undefined)return a.E3_Data.value[b];
	return undefined;
};

E3_Object.prototype.SetEv=function(b,c){
	var a=this;
	while(a.E3_Data.parent!=a){
		if(a.E3_Data.value[b]!=undefined){
		a.E3_Data.value[b]=c;
		return this;
		}
		a=a.E3_Data.parent;
	}
	if(a.E3_Data.value[b]!=undefined){
		a.E3_Data.value[b]=c;
		return this;
	}
	this.E3_Data.value[b]=c;
	return this;
};

E3_Object.prototype.Var=function(b,c){
	if(isArray(b)){
		if(isArray(c)){
			for(var i in b){
				this.E3_Data.value[b[i]]=c[i];
			}
		}else{
			for(var i in b){
				this.E3_Data.value[b[i]]=c;
			}
		}
	}else{
		this.E3_Data.value[b]=c;
	}
	return this;
};

E3_Object.prototype.Overcome=function(a){

};
