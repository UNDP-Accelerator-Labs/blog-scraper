export function isLoading (value){
    if(value) d3.select('#loader').style('display', 'block');
    else d3.select('#loader').style('display', 'none');
}