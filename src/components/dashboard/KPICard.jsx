import React from "react";


export default function KPICard({
title,
value,
indicator
}){


return (

<div className="kpi-card">


<small>
{title}
</small>


<strong>
{value}
</strong>


<span>
{indicator}
</span>


</div>


)

}