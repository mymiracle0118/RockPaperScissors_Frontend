import CupImage from '../assets/image/cup.png'
import {Alert} from '@mui/material'
export default function LogPanel(props : any){
    return <Alert icon={false}  sx={{backgroundColor:"white"}}>
        <span><img src={CupImage} alt={"cup"}/></span> <span className="text-danger">{props.log.winnerName}</span> JUST FINESSED <span className="text-primary">{props.log.loserName}</span> OUR OF {props.log.pizeAmount}! BETTER LUCK NEXT TIME
    </Alert>
}