<template>
  <div>
    <!--還沒做動態更改第一點的功能 如果麻醉開始時間可以被更改的話應該會出錯
    更改寬度：.chartRC{width:??px} .inDIVrc{width:??px}
    畫的框線寬度也要改 click跟move的判斷也要改
    -->
    <div v-if="showModal" id="modalDiv" @click="closeModal"></div>
    <div :class="classNam.wrapper">
      <div :class="classNam.title">
        <div :class="classNam.titleItem" v-for="(item) in titleArr" :key="item.eng">
          <div :class="classNam.eng">{{item.eng}}</div>
          <div :class="classNam.chi">{{item.chi}}</div>
        </div>
      </div>
      <svg :class="classNam.inDIV" />
      <svg
        :class="classNam.chart"
        @click="mouseEvent('click')"
        @mousemove="mouseEvent('move')"
        @mouseout="mouseEvent('out')"
      />
      <div class="del_tooltip">
        <div class="tpwrap" style="display:flex; flex:row;position:relative;">
          <div class="timeStr"></div>
          <div
            class="delBtn"
            @click="deleteData(pointData.length-1);drawLine();drawPoint();showModal = false;"
          >刪除</div>
          <div class="cancelBtn" @click="showModal = false;"></div>
        </div>
      </div>
    </div>
    <!-- <div
      style="width:40px;height:20px;border:1px solid purple;cursor:pointer;"
      @click="clickStore=false;"
    >儲存</div>測試用
    <div
      style="width:40px;height:20px;border:1px solid purple;cursor:pointer;"
      @click="getAnesRecBreath()"
    >取得</div>-->
  </div>
</template>
 
<script>
import * as d3 from 'd3';
import moment from 'moment'
import { mapState,mapGetters } from 'vuex';
import {bus} from '../../../../bus'
  import { callws } from '@/api/index.js'
 
export default {
 name: 'respCont',
 data(){
   return {
     showModal: false,
     //
      classNam:{wrapper:'wrapperRC',title:'titleRC',titleItem:'titleItemRC',eng:'engRC',chi:'chiRC',chart:'chartRC',inDIV:'inDIVRC',drawCircle:'drawCircleRC',drawLine:'drawLineRC',tooltip:'tooltipRC',hoverCircle:'hoverCircleRC',pointLine:'pointLineRC'},
      posPara:{tooltipPos:{x:195,y:-55},posTop:{inDIV:2,title:8,chart:-2},},
      titleArr:[
        {eng:'Spon',chi:'自發性呼吸'},
        {eng:'Assi',chi:'協助性呼吸'},
        {eng:'Cont',chi:'控制性呼吸'},
      ],
     //
     intervalId:null,
     timeRounded:null,
     zx:null,
     xAxis:null,
     gx:null,
     gy:null,
     grid:null,
     gGrid: null,
     gData:null,
     clickPointLimit: true,
     bandW:0,
     yStart:0,
     basicSettings:{
       margin:{top:-5,right:10,bottom:10,left:15},
       width: 790.5,
       height: 90,
     },
     pointData:[],
     expData:[],
   }
 },
 computed: {
   xScale: function(){
     return d3.scaleTime()
                    .domain([Date.now(),Date.now()+3*60*60*1000])
                    .range([0,this.basicSettings.width-0.5])
                    .nice();
   },
   ...mapState(["vsWidth", "vsTransform"]),
   ...mapGetters({
     x:'x',
     patient:'getPatientInfo'
   }),
   y1: function(){
     return  d3.scaleBand()
                    .domain([`${this.titleArr[2].eng}`,`${this.titleArr[1].eng}`,`${this.titleArr[0].eng}`])
                    .range([90,0]);
   },
 },
 created(){
   bus.$on('saveRCdata',this.trnAnesRecBreath);
 },
 mounted(){
   console.log('inDIV寬度',this.vsWidth+242,'chartRC寬度',this.vsWidth,'div框線寬度',this.vsWidth+240,'svgMove',this.vsWidth+41)
   //畫軸和格線(先畫線 再畫圓)
   this.drawDynamicAxisGrid();
   //設定元件寬度
   d3.select(`.${this.classNam.inDIV}`).style('width',`${this.vsWidth+242}px`);
   d3.select(`.${this.classNam.chart}`).style('width',`${this.vsWidth}px`);
   //改元件的高度
   d3.select(`.${this.classNam.inDIV}`).style('top',`${this.posPara.posTop.inDIV}px`);
   d3.select(`.${this.classNam.title}`).style('top',`${this.posPara.posTop.title}px`);
   d3.select(`.${this.classNam.chart}`).style('top',`${this.posPara.posTop.chart}px`);
   //
   this.gData = d3.select(`.${this.classNam.chart}`).append('g').classed(`${this.classNam.pointLine}`,true);
   d3.select(`.${this.classNam.pointLine}`).append('g').classed(`${this.classNam.drawLine}`,true);
   d3.select(`.${this.classNam.pointLine}`).append('g').classed(`${this.classNam.drawCircle}`,true);
   d3.select(`.${this.classNam.wrapper}`).append('div').classed(`${this.classNam.tooltip}`,true);
   d3.select(`.${this.classNam.inDIV}`).append('path').attr('d',"M242,0V90").attr('fill','none')
             .attr('stroke','#737895')
             .attr('stroke-width','2');
 
   let point = d3.select(`.${this.classNam.drawCircle}`).selectAll('circle');
   point.on('click',this.pointClick);
   //將第一點讀進來 畫點線
   let stimeTox = this.x(new Date(this.patient.S_tim));
   this.pointData.push({x:stimeTox,y:20});
   this.expData.push(this.convertData(stimeTox,20));
   this.drawLine();
   this.drawPoint();
   //把之前存的值帶進來
   this.getAnesRecBreath();
 
 },
 activated() {
    this.intervalId = setInterval(() => {
        this.trnAnesRecBreath()
      }, 300000)
    },
 deactivated() {
   clearInterval(this.intervalId)
   bus.$off('saveRCdata');
 },
 watch: {
   pointData: function(){
     //移除監聽事件
     d3.select(`.${this.classNam.drawCircle}`)
       .selectAll('circle')
       .on('click', null)
       .on('mouseover', null)
       .on('mouseout', null);
 
     let point = d3.select(`.${this.classNam.drawCircle}`).selectAll('circle');
     point.on('click',this.pointClick)
          .on('mouseover',this.pointOver)
          .on('mouseout',this.pointOut);
    
     //刪掉不必要的資料
     this.checkallpData();
   },
   vsTransform: function(newVal, oldVal) {
     const zx = newVal.rescaleX(this.x).interpolate(d3.interpolateRound)
     this.zx = zx;
     let xInterval = newVal.k > 2 ? 1 : 5
    
     this.gData.attr("transform", `translate(${newVal.x},0)`);
     this.gx.call(this.xAxis, zx, xInterval)
     this.gGrid.call(this.grid, zx, this.y1, xInterval)
   },
 },
 methods:{
   //關掉modal 移除click提示框
   closeModal(){
     this.showModal = false;
     d3.select(`.del_tooltip`).style('display','none');
   },
   //把後端資料轉成數值帶入畫點
   turnStringToNum(timeStr,respKind){
     let exportTime = new Date(timeStr);
     let x = this.x(exportTime)
    
     let y;
     if(respKind==`${this.titleArr[0].eng}`){y=20;}
     if(respKind==`${this.titleArr[1].eng}`){y=50;}
     if(respKind==`${this.titleArr[2].eng}`){y=80;}
     let result = {x:x,y:y};

     return result;
   },
   drawDynamicAxisGrid(){
    //zoom需要的數值
    let stim = Date.now()
    let dt = new Date(stim)
    let start_h = dt.getHours()
    let start_m = parseInt(dt.getMinutes() / 5) * 5
    let svg = d3.select(`.${this.classNam.chart}`);
  
    this.xAxis = (g, x, interval) => g
     .attr("transform", `translate(0,120)`)
     .call(
       d3
         .axisTop(x)
         .tickSize(5)
         .tickPadding(8)
         .tickFormat( x => {
           let time = new Date(x)
           if (time.getMinutes()==0) {
             return ''
           }
           else if (time.getHours() == start_h && time.getMinutes() == start_m) {
             return d3.timeFormat("%H:%M")(x)
           } else {
             return d3.timeFormat("%M")(x)
           }
         })
         .ticks(d3.timeMinute.every(interval))
     )

      this.grid = (g, x, y, interval) => g
          .attr("transform", `translate(0, 0)`)
          .attr("stroke", "#B4B9D8")
          .attr("stroke-opacity", 1.0)
          .call(g => g
            .selectAll(".x")
            .data(x.ticks(d3.timeMinute.every(interval)))
            .join(
              enter => enter.append("line")
                .attr('class', 'x')
                .attr("y1", 5)
                .attr("y2", 92),
              update => update,
              exit => exit.remove()
            )
            .attr("x1", (d) => 0.5 + x(d))
            .attr("x2", (d) => 0.5 + x(d))
          )
          .call(g => g
            .selectAll(".y")
            .data([20,50])
            .join(
              enter => enter.append("line")
                .attr('class', 'y')
                .attr("x1", 0)
                .attr("x2", this.vsWidth),
              update => update,
              exit => exit.remove()
            )
            .attr("y1", (d) => d+15)
            .attr("y2", (d) => d+15)
          )
          .call(g => g
            .selectAll(".bx")
            // x 軸每 15 分鐘畫 1 粗直線 （class: bx）
            .data(x.ticks(d3.timeMinute.every(15)))
            .join(
              enter => enter.append("line")
                .attr('class', 'bx')
                .attr("stroke", "#737895")
                .attr('stroke-width', "2")
                .attr("y1", 5)
                .attr("y2", 92),
              update => update,
              exit => exit.remove()
            )
            .attr("x1", (d) => 0.5 + x(d))
            .attr("x2", (d) => 0.5 + x(d))
        )
      

       this.gx = svg.append("g").attr("class", 'gx').style("font", "12px Arial");
       this.gGrid = svg.append("g").attr("class", 'gGrid');
       this.gx.call(this.xAxis, this.x, 5);
       this.gGrid.call(this.grid, this.x, this.y1, 5)
 
     this.bandW  = this.y1.bandwidth();
     this.yStart = this.y1(`${this.titleArr[0].eng}`);
     d3.selectAll('.kindAxis').select('.domain').remove();

     //補title div框線
     //中間兩條
     let divBlock = d3.select(`.${this.classNam.inDIV}`);
     divBlock.append('path')
             .attr('d','M0,61H241')
             .attr('fill','none')
             .attr('stroke-width','0.4')
             .attr('stroke','#737895');
     divBlock.append('path')
             .attr('d','M0,31H241')
             .attr('fill','none')
             .attr('stroke-width','0.4')
             .attr('stroke','#737895');
     //包住最外層的框線
     divBlock.append('rect')
             .attr('fill','none')
             .attr('stroke','#737895')
             .attr('stroke-width','2')
             .attr('width',this.vsWidth+240) //改寬度
             .attr('transform','translate(1,1)')
             .attr('height',88);
   },
   checkallpData(){
     if(this.pointData.length>=3){
       console.log('check data');
       this.pointData.forEach((item,index)=>{
         if(index+2<this.pointData.length){
         //檢查連續三個點有沒有不合理的情況
         let the_last = this.pointData[index+2];
         let the_second_last = this.pointData[index+1];
         let the_third_last = this.pointData[index];
         //
         //畫了相同的x軸會自動被merge
          if(the_last.x==the_second_last.x){
            this.deleteData(index+1);
            this.drawLine();
            this.drawPoint();
          }
          //畫了相同的y軸會自動被merge 如果x畫在不合理的地方會被放回正確的位置
          if(the_last.y==the_second_last.y && the_last.y==the_third_last.y){
            this.deleteData(index+1);
            this.drawLine();
            this.drawPoint();
          }
          if(the_second_last.y==the_third_last.y){
            if(the_last.x!==the_second_last.x && the_last.y!==the_second_last.y){
              this.deleteData(index+1);
              this.drawLine();
              this.drawPoint();         
            }
          }

         //
         }
       })
     }
   },
   pointOver: function(d,coords){
     //hover圓時產生透明遮罩
     d3.select(`.${this.classNam.pointLine}`).append('circle').classed(`${this.classNam.hoverCircle}`,true);
     d3.select(`.${this.classNam.hoverCircle}`)
       .attr('cx',coords.x)
       .attr('cy',coords.y)
       .attr('r',8)
       .attr('fill','#539840')
       .attr('opacity',.2);
   },
   pointOut: function(d,coords){
     //移出座標點時把hoverCircle的透明遮罩移除
     d3.select(`.${this.classNam.hoverCircle}`).remove();
   },
   // pointHover: function(){ //另一種hover
   //   d3.select('.drawCircle').selectAll("circle")
   //       .on("mouseover", function(){
         //   d3.select(this)
         //     .attr('fill','orange')
         //     .attr('stroke','none')
         //     .attr('r',6);
 
         // })
   //       .on("mouseout", function(){
   //         d3.select(this)
   //           .attr('fill','#539840')
   //           .attr('r',5);
   //       });
   // },
   pointClick: function(d,coords){
     event.stopPropagation();//按circle時不會啟動svg click事件
     //產生遮罩 點掉提示框才能做別的事
     this.showModal = true;
     d3.select(`.del_tooltip`).style('display','none');
     d3.select(`.cancelBtn`).on('click',null);
     this.clickPointLimit = false;//按點不會增加新的點

     //時間換算
      let timeStr;
      if(this.zx==undefined){
        timeStr = new Date(this.x.invert(coords.x+this.vsTransform.x));
      }else{
        timeStr = new Date(this.zx.invert(coords.x+this.vsTransform.x));
      }
    
      let hm = d3.timeFormat('%H:%M')(timeStr);

      d3.select(`.del_tooltip`)
        .style('display','block')
        .style('left',`${coords.x+this.posPara.tooltipPos.x+this.vsTransform.x}px`)
        .style('top',`${coords.y+this.posPara.tooltipPos.y}px`);
      
      d3.select(`.timeStr`).text(hm);
      //取消 則提示框消失 不刪點
      d3.select(`.cancelBtn`).on('click',function(){
        d3.select(`.del_tooltip`).style('display','none');
        //點cancel後移除遮罩
        this.showModal = false;
      });

     //如果是最後一點 就顯示刪除 不是最後一點就只顯示取消
     if(this.pointData[this.pointData.length-1].x==coords.x && this.pointData[this.pointData.length-1].y==coords.y){
      if(this.pointData.length!==1){
        d3.select(`.delBtn`).style('display','block');
        d3.select(`.cancelBtn`).style('margin-left','120px');
        d3.select(`.delBtn`).style('display','block').text('刪除');
      }else{//如果第一點就是最後一點 也只顯示取消
        d3.select(`.delBtn`).style('display','none');
        d3.select(`.cancelBtn`).style('margin-left','60px');
      }
       
     }else{
       d3.select(`.delBtn`).style('display','none');
       d3.select(`.cancelBtn`).style('margin-left','60px');
     }

   },
   //產生tooltip上的時間
   convertData: function(x,y){
    let timeStr;
    if(this.zx==undefined){
      timeStr = new Date(this.x.invert(x+this.vsTransform.x));
    }else{
      timeStr = new Date(this.zx.invert(x+this.vsTransform.x));
    }
    
    let hm = d3.timeFormat('%H:%M')(timeStr);
    let exportTime = moment(timeStr).format('YYYY-MM-DD HH:mm');
    
         
     let typeStr;
     if(y==20){typeStr=`${this.titleArr[0].eng}`;}
     if(y==50){typeStr=`${this.titleArr[1].eng}`;}
     if(y==80){typeStr=`${this.titleArr[2].eng}`;}
     let result = {x:exportTime,type:typeStr};
     return result;
   },
   deleteData: function(index){
     if(this.pointData.length>1){
     this.pointData.splice(index,1);
     this.expData.splice(index,1);
     d3.select(`.${this.classNam.hoverCircle}`).remove();
     d3.select(`.del_tooltip`).style('display','none');
     }
   },
   //以時間排序座標點
   sortPointData(){
     this.pointData.sort(function(a,b){return a.x-b.x;});
     this.expData = [];
     this.pointData.forEach(data=>{
       this.expData.push(this.convertData(data.x,data.y));
     });
   },
   drawLine: function(){
     this.sortPointData();
     //設定線條格式
     let line = d3.line()
                  .x(d=>d.x)
                  .y(d=>d.y)
                  .curve(d3.curveStepAfter);
 
     //將線統一放在mounted時append在svg上的g className=drawLine 並傳入資料
     let update = d3.select(`.${this.classNam.drawLine}`)
                    .selectAll('path')
                    .data(this.pointData);
 
     //判斷現在的資料是增加還是減少
     update.enter()
           .append('path')
           .merge(update) //這樣才會將attr更新到所有的data
           .attr('d',line(this.pointData))
           .attr('fill','none')
           .attr('stroke','#539840');
 
     //有多的資料就清掉
     update.exit().remove();
  
   },
   drawPoint: function(){
     //將資料帶入 enter append即可
     //將點統一放在mounted時append在svg上的g className=drawCircle
     let update = d3.select(`.${this.classNam.drawCircle}`)
                    .selectAll('circle')
                    .data(this.pointData);
    
     //判斷現在的資料是增加還是減少
     update
       .enter()
       .append('circle')
       .merge(update) //這樣才會將attr更新到所有的data
       .attr('cx',d=>d.x)
       .attr('cy',d=>d.y)
       .attr('r',2.5)
       .attr('fill','#539840')
       .attr('stroke','#539840');
 
     //有多的資料就清掉
     update.exit().remove();
   },
   svgRCclick: function(){
       this.clickPointLimit = true;
       let svgRangeLimit = true;

       let coords = d3.pointer(event);
       let x = coords[0];
       let y = coords[1];
       //只能在圖表範圍內畫點(x不能小於第一個點的x值)
       if(x > this.pointData[0].x){
         if(y > 7 && y < 94){
           svgRangeLimit = true;
         }else{
           svgRangeLimit = false;
         }
       }else{
         svgRangeLimit = false;
       }
 
       //用原畫面x範圍限制完以後 將x變成畫點要用的x
       x = coords[0]-this.vsTransform.x;
      
 
       //限制y的座標落點只能在各欄正中央
       let y1 = this.yStart+5;
       let y2;
       for(let i=0;i<4;i++){
         y2 = y1 + this.bandW;
         if(y>=y1&&y<y2){
           y = (y1+y2)/2;
 
         }
         y1 += this.bandW;
       }
      
     
       //因為x軸同個時間的座標點可能會有細微差異 所以如果前面已經點過相同時間點 就比照第一個點過的x值
       let temp = this.convertData(x,y);
       console.log(temp,this.expData.length);
       this.expData.forEach((item,index)=>{
         console.log(item.x);
         if(temp.x==item.x){
           x = this.pointData[index].x;
         }
       });
      
 
       //暫存點線資料
       if(svgRangeLimit  && this.clickPointLimit){
         //將座標點轉換成時間和呼吸控制種類
         this.expData.push(this.convertData(x,y));
         this.pointData.push({x:x,y:y});
        //  bus.$emit('sendPointData',{x:x,y:35}); //模擬remark
       }
 
       this.drawLine();
       this.drawPoint();
   },
   svgRCmove: function(){
     //滑過svg就顯示時間的tooltip
     let coords = d3.pointer(event);
     const timeFormat = d3.timeFormat("%H:%M");
     if(this.zx==undefined){
       this.timeRounded = new Date(this.x.invert(coords[0]));
     }else{
       this.timeRounded = new Date(this.zx.invert(coords[0]));
     }

     if(coords[0] > 0 && coords[0] < this.vsWidth+41){
         if(coords[1] > 5 && coords[1] < 127){
             d3.select(`.${this.classNam.tooltip}`)
               .style('display','block')
               .style('left',`${coords[0]+this.posPara.tooltipPos.x}px`)
               .style('top',`${coords[1]+this.posPara.tooltipPos.y}px`)
               .text(timeFormat(this.timeRounded));
 
         }
     }
    
   },
   svgRCout: function(){
     //滑出svg則不顯示時間的tooltip
     d3.select(`.${this.classNam.tooltip}`).style('display','none');
   },
   mouseEvent: function(eventType){
     if(eventType=='click'){//mouseclick
       this.svgRCclick();
     }
     if(eventType=='move'){//mousmove
       this.svgRCmove();
     }
     if(eventType=='out'){//mouseout
       this.svgRCout();
     }
   },
   async getAnesRecBreath() {
        let param = new FormData()
        let obj = {
          wb_base64: 0,
          wb_big5: 0,
          ftp_sn: this.$store.state.now_form.FTP_SN,
        }
        param.append('var', Base64.encode(JSON.stringify(obj)))
        let tag = 'pvt.orms.getAnesRecBreath'

        let result = await callws(param, tag)
        if (result) {
          result = JSON.parse(Base64.decode(result))
          if (result.sts === '000000') {

            const data = JSON.parse(result.val.value[obj.ftp_sn]['JSN_DESC'])
            console.log('得到呼吸控制資料', result.val.value)
            d3.select(`.${this.classNam.hoverCircle}`).remove();
            // d3.select(`.del_tooltip`).style('display','none');
            // this.showModal = false;   
            this.pointData = [];
            this.expData = [];
            data.forEach(item=>{
              this.pointData.push(this.turnStringToNum(item.x,item.type));
              this.expData.push({x:item.x,type:item.type});
              this.drawPoint();
              this.drawLine();   
              
            })

          } else {
            console.log(result.msg)
          }
        }
      },
      async trnAnesRecBreath() {
        // let len = this.expData.length;
        // if(len>1){
        //   if(this.expData[len-1].type==this.expData[len-2].type){
        //     this.deleteData(len-1);
        //   }
        // } 看需不需要把最後一個相同y軸的點刪掉再加上

        let param = new FormData()
        let obj = {
          wb_base64: 0,
          wb_big5: 0,
          ftp_sn: this.$store.state.now_form.FTP_SN,
          seq_no: 1,
          tsc: 'A',
          rtp: this.$store.state.emp_no,
          jsn_desc: this.expData
        }

        param.append('var', Base64.encode(JSON.stringify(obj)))
        let tag = 'pvt.orms.trnAnesRecBreath'

        let result = await callws(param, tag)
        if (result) {
          result = JSON.parse(Base64.decode(result))
          console.log('呼吸控制 儲存結果', result);
          this.getAnesRecBreath();
          if (result.sts !== '000000') {
            console.log(`${result.sts}: ${result.msg}`)
          }else{
            bus.$emit('trnrc','rc');
          }
        }

      },
 },
}
</script>
 
<style>
.wrapperRC {
  position: relative;
  margin-top: 5px;
  margin-left: 21.5px;
}
.inDIVRC {
  /* width: 1002px; */
  height: 95px;
  position: absolute;
}
.titleRC {
  width: 230px;
  height: 84px;
  position: absolute;
  left: 0px;
  top: 3px;
}

.titleItemRC {
  width: 230px;
  height: 28px;
  position: relative;
}

.chiRC {
  position: absolute;
  left: 104px;
}

.engRC {
  position: absolute;
  left: 21px;
  top: 3px;
}

.chartRC {
  /* width: 760px; */
  height: 95px;
  position: absolute;
  left: 241.5px;
}

.drawCircleRC {
  cursor: pointer;
}

.hoverCircleRC {
  pointer-events: none;
}

.tooltipRC {
  position: absolute;
  left: 0px;
  background-color: #f6f7ff;
  width: 80px;
  height: 30px;
  font-size: 15px;
  text-align: center;
  padding-top: 6px;
  box-sizing: border-box;
  color: #536dfe;
  border-radius: 3px;
  box-shadow: 0px 3px 6px #00000033;
  display: none;
  z-index: 2;
}

.del_tooltip {
  position: absolute;
  left: 0px;
  background-color: #f6f7ff;
  height: 38px;
  font-size: 15px;
  padding-top: 8px;
  padding-right: 6px;
  box-sizing: border-box;
  color: #07092f;
  border-radius: 3px;
  box-shadow: 0px 3px 6px #00000033;
  display: none;
  z-index: 2;
}
.timeStr {
  position: absolute;
  font-size: 16px;
  left: 10px;
  top: 3px;
}
.delBtn {
  position: absolute;
  width: 50px;
  height: 25px;
  left: 60px;
  top: -1.5px;
  color: #b4b9d8;
  border: 1px solid #b4b9d8;
  border-radius: 3px;
  font-size: 14px;
  padding: 0px 10px;
  box-sizing: border-box;
  cursor: pointer;
  display: none;
}

.cancelBtn {
  position: relative;
  width: 15px;
  height: 15px;
  /* margin-left: 110px; */
  margin-top: 4px;
  cursor: pointer;
}

.cancelBtn:before,
.cancelBtn:after {
  position: absolute;
  left: 6px;
  top: 0px;
  content: "";
  height: 15px;
  width: 1.5px;
  background-color: #b4b9d8;
}
.cancelBtn:before {
  transform: rotate(45deg);
}
.cancelBtn:after {
  transform: rotate(-45deg);
}

#modalDiv {
  width: 100%;
  height: 100%;
  background-color: transparent;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;
  z-index: 1;
}
</style>
 

