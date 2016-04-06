/**
 * Created by Exbo on 2016/3/31.
 */
//如图（打开查看），创建一个虚拟宇宙，包括一个行星和飞船
var universe=new E3_Object("宇宙");
var planet=new E3_Object("行星",universe);

//每个飞船由以下部分组成
function gSpaceShip(id) {
    var ship = new E3_Object("飞船");
    ship.Var("id",id);
    //动力系统，
    var engine = new E3_Object("动力系统", ship);
    //可以完成飞行和停止飞行两个行为，
    //飞船有两个状态：飞行中和停止，飞船的行为会改变这个属性状态
    engine.Var("state", "stopped"/*flying*/);
    engine.On("start",0,function(){
        this.Emit("event",{type:"飞船开始飞行",arg:ship});
        this.SetEv("state","flying")
    });
    engine.On("stop",0,function(){
        this.Emit("event",{type:"飞船停止飞行",arg:ship});
        this.SetEv("state","stopped")
    });
    //暂定所有飞船的动力系统飞行速度是一致的，比如每秒20px，
    engine.Var("fly_speed", 20);
    engine.Var("degree",0);
    engine.On("tick", 20, function (e) {
        var spt=this.Ev("time_per_tick");
        var stl=(this.Ev("state")=="flying");
        var height=this.Ev("height");
        var degree=this.Ev("degree");
        var speed=this.Ev("fly_speed");
        if(stl){
            var a=spt*speed/height;
            this.SetEv("degree",degree+a);
        }
    });
    //飞行过程中会按照一定速率消耗能源（比如每秒减5%）
    engine.On("tick", 5, function (e) {
        var spt=this.Ev("time_per_tick");
        var stl=(this.Ev("state")=="flying");
        if(stl){
            this.SetEv("fuel",this.Ev("fuel")-5*spt);
        }
    });

    //能源系统，提供能源，并且在宇宙中通过太阳能充电（比如每秒增加2%，具体速率自定）
    var energy=new E3_Object("能源系统",ship);
    energy.On("tick", 4, function (e) {
        var spt=this.Ev("time_per_tick");
        this.SetEv("fuel",this.Ev("fuel")+2*spt);
    });
    energy.On("tick", 30,function (e) {
       if(this.Ev("fuel")>100){
           this.SetEv("fuel",100);
       }
    });

    //信号接收处理系统，用于接收行星上的信号
    var receiver=new E3_Object("信号接收处理系统",ship);
    //每个飞船通过信号接收器，接受到通过Mediator传达过来的指挥官的广播信号，但因为是广播信号，所以每个飞船能接受到指挥官发出给所有飞船的所有指令，因此需要通过读取信息判断这个指令是不是发给自己的
    receiver.On("command",0,function(e){
        if(e.type==this.Ev("type") && e.id==this.Ev("id")){
            ship.Call(e.command);
        }
    });

    //自爆系统，用于自我销毁
    var blow=new E3_Object("自爆系统",ship);

    //每个飞船的能源是有限的，用一个属性来表示能源剩余量，这是一个百分比，表示还剩余多少能源。
    ship.Var("fuel",100);

    //能源耗尽时，飞船会自动停止飞行
    ship.On("tick",8,function(e){
        if(this.Ev("fuel")<=0 && this.Ev("state")=="flying"){
            this.Call("stop");
        }
    });


    //飞船的自我销毁方法会立即销毁飞船自身
    blow.On("blow",0,function(){
        this.Emit("event",{type:"飞船被销毁",arg:ship});
        ship.Remove();
    });

    //飞行后飞船会围绕行星做环绕运动，需要模拟出这个动画效果
    ship.On("draw",30,function(e){
        if(this.Ev("draw_type")==this.Ev("type")){
            var c= e.context;
            var cx= e.width/2;
            var cy= e.height/2;
            var height=this.Ev("height");
            var degree=this.Ev("degree");
            c.setTransform(1,0,0,1,0,0);
            var x=cx+height*Math.cos(degree);
            var y=cy+height*Math.sin(degree);
            c.translate(x,y);
            c.rotate(degree+Math.PI/2);
            c.fillStyle="#008";
            c.fillRect(-30,-12,60,24);
            c.fillStyle=(this.Ev("type")=="normal"?"#F8F":"#8FF");
            c.textAlign="left";
            c.textBaseline="middle";
            c.fillText("id "+this.Ev("id")+" "+(this.Ev("fuel")>>0)+"%",-30,0);

        }
    });

    return ship;
}

//行星上有一个指挥官（不需要在页面上表现出其形象）
var commander=new E3_Object("指挥官",planet);

//指挥官可以通过行星上的信号发射器发布如下命令
var emitter=new E3_Object("信号发射器",planet);


//创建一个新的飞船进入轨道，
//commander.id=0;
commander.createShip=function(){
    //最多可以创建4个飞船，
    var rt=this.Emit("count_virtual_ship",{count:0,id:[]});
    for(var id=0;id<4;id++){
        if(!rt.id[id])break;
    }
    if(rt.count>=4)return false;

    //指挥官并不知道自己的指令是不是真的传给了飞船，飞船的状态他是不知道的，他只能通过自己之前的操作来假设飞船当前的状态
    var virtual_ship=gSpaceShip(id);
    var ship=gSpaceShip(id);
   // commander.id++;
    virtual_ship.Var("type","virtual");
    ship.Var("type","normal");

    //刚被创建的飞船会停留在某一个轨道上静止不动
    var i=((Math.random()*4)>>0)%4;
    var obt=universe.orbits[i];
    obt.SHost(ship);
    obt.SHost(virtual_ship);
    var deg=Math.random()*2*Math.PI;//设置位置
    ship.SetEv("degree",deg);
    virtual_ship.SetEv("degree",deg);


    virtual_ship.On("count_virtual_ship",0,function(e){e.count++;e.id[this.Ev("id")]=1;});
    var b=$g("div");
    var b1= b.$Gap("span").$t("飞船"+id);
    var b2= b.$Gap("button").$t("开始飞行");
    var b3= b.$Gap("button").$t("停止飞行");
    var b4= b.$Gap("button").$t("销毁");
    b2.onclick=function(){
        commander.makeCommand(id,"start");
    };
    b3.onclick=function(){
        commander.makeCommand(id,"stop");
    };
    b4.onclick=function(){
        commander.makeCommand(id,"blow");
    };
    tb.dom.$ap(b);
    virtual_ship.On("blow",45,function(e){
        b.$del();
    });

};

//假设有4个轨道
function gOrbit(height,base){
    var orbit=new E3_Object("轨道",base);
    orbit.Var("height",height);

    orbit.On("draw",10,function(e){
        var c= e.context;
        var w= e.width/2;
        var h= e.height/2;
        var r= this.Ev("height");
        c.strokeStyle="#000";
        c.beginPath();
        c.moveTo(w+r,h);
        for(var i=0;i<=40;i++){
            c.lineTo(w+r*Math.cos(i/40*2*Math.PI),w+r*Math.sin(i/40*2*Math.PI));
        }
        c.stroke();
        c.closePath();
    });
    return orbit;
}
universe.orbits=[gOrbit(100,universe),gOrbit(150,universe),gOrbit(200,universe),gOrbit(250,universe)];

commander.makeCommand=function(id,command){
    planet.Call("make_command",{id:id,command:command});
};
//命令某个飞船开始飞行
commander.START_COMMAND="start";
//命令某个飞船停止飞行
commander.STOP_COMMAND="stop";
//命令某个飞船销毁，销毁后飞船消失、飞船标示可以用于下次新创建的飞船
commander.KILL_COMMAND="blow";
/*
你需要设计类似如下指令格式的数据格式
{
    id: 1,
        commond: 'stop'
}
*/
emitter.On("make_command",0,function(e){
    universe.Call("emit_command",{id: e.id,command: e.command});
});

//指挥官通过信号发射器发出的命令是通过一种叫做Mediator的介质进行广播
var mediator=new E3_Object("Mediator",universe);

//Mediator是单向传播的，只能从行星发射到宇宙中，在发射过程中，有30%的信息传送失败（丢包）概率，你需要模拟这个丢包率，另外每次信息正常传送的时间需要1秒
mediator.On("emit_command",0, function (e) {
     var t=(Math.random()<0.7);
     if(t){
        setTimeout(function(){
            mediator.Emit("command",{type:"normal",id: e.id,command: e.command});
        },1000);
     }else{
         this.Emit("event",{type: e.command+"丢包啦!",arg: e.id,deep:1})
     }
    setTimeout(function(){
        mediator.Emit("command",{type:"virtual",id: e.id,command: e.command});
    },1000);
});

/* 以下是附带显示等功能 */

//时钟产生器
var timer=new E3_Object("时钟",universe);
timer.stopped=1;
timer.willstop=0;
timer.stop=function(){
    this.willstop=1;
};
timer.start=function(){
    if(this.stopped){
        this.stopped=0;
        this.mainLoop();
    }
    this.willstop=0;
};
timer.mainLoop=function(){
    universe.SetEv("time_per_tick",0.016);
    timer.Emit("tick");
    timer.Emit("draw");
    //p.make();
    if(timer.willstop) {
        timer.stopped=1;
    }else{
        setTimeout(timer.mainLoop, 16);
    }
};

//绘制指挥官想象中的
universe.Var("draw_type","virtual");

//画板
var canvas=new E3_Object("画板",universe);
canvas.dom=document.createElement("canvas");
canvas.dom.width=600;
canvas.dom.height=600;
document.body.appendChild(canvas.dom);
canvas.On("draw",0,function(e){
    e.context=this.dom.getContext("2d");
    e.width=this.dom.width;
    e.height=this.dom.height;
    this.dom.width=this.dom.width;
});

planet.On("draw",10,function(e){
    var c= e.context;
    var w= e.width/2;
    var h= e.height/2;
    c.fillStyle="#000";
    c.beginPath();
    c.moveTo(w+50,h);
    for(var i=0;i<=40;i++){
        c.lineTo(w+50*Math.cos(i/40*2*Math.PI),w+50*Math.sin(i/40*2*Math.PI));
    }
    c.fill();
    c.closePath();
});

//控制台
var message=new E3_Object("控制台",universe);
message.On("event",0,function(e){
    if(e.arg.name=="飞船") {
        this.log(e.arg.Ev("type") + " id:" + e.arg.Ev("id") + " " + e.type, e.deep);
    }else{
        this.log("id:" + e.arg + " " + e.type, e.deep);
    }
});
message.log=function(message,deep){
    var flag=1;
    if(this.console.scrollHeight==this.console.scrollTop+this.console.clientHeight){
        flag=1;
    }
    var lll=this.console.$Gap("div").$t(message).$c("consoleitem");

    if(flag){
        this.console.scrollTop=this.console.scrollHeight;
    }
    if(deep){
        console.log(message);
        lll.$st("color","red");
    }
};