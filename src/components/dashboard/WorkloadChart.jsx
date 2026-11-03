import React from "react";
import {
BarChart,
Bar,
XAxis,
Tooltip,
ResponsiveContainer
}
from "recharts";


const data=[

{
name:"Troubleshoot",
value:27
},

{
name:"Maintenance",
value:20
},

{
name:"Administrasi",
value:51
}

];


export default function WorkloadChart(){


return (

<section className="workload-card">


<h3>
Workload & KPI Diagram
</h3>


<p>
Kompilasi rasio performa & kepatuhan SLA dalam persentase (%)
</p>



<ResponsiveContainer
width="100%"
height={240}
>


<BarChart data={data}>


<XAxis
dataKey="name"
/>


<Tooltip/>


<Bar

dataKey="value"

radius={[8,8,0,0]}

/>


</BarChart>


</ResponsiveContainer>


</section>


)

}