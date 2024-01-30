export function showToast  ( 
        message = "", 
        toastType = "info", 
        duration = 5000
    ){ 

    let icon = { 
        success: 
        `<span>
            <i class='fa fa-check-circle'> </i>
        </span>`, 
        danger: 
        `<span>
            <i class='fa fa-times'> </i>
        </span>`, 
        warning: 
        `<span>
            <i class='fa fa-exclamation-triangle'> </i>
        </span>`, 
        info: 
        `<span>
            <i class='fa  fa-info-circle'> </i>
        </span>`, 
    }; 

    if (!Object.keys(icon).includes(toastType)) 
        toastType = "info"; 
  
    let box = document.createElement("div"); 
    box.classList.add( 
        "toast", `toast-${toastType}`); 
    box.innerHTML = ` <div class="toast-content-wrapper"> 
                      <div class="toast-icon"> 
                      ${icon[toastType]} 
                      </div> 
                      <div class="toast-message">${message}</div> 
                      <div class="toast-progress"></div> 
                      </div>`; 
    duration = duration || 5000; 
    box.querySelector(".toast-progress").style.animationDuration = `${duration / 1000}s`; 
  
    let toastAlready =  document.body.querySelector(".toast"); 
    if (toastAlready) { 
        toastAlready.remove(); 
    } 
  
    document.body.appendChild(box)
}; 
