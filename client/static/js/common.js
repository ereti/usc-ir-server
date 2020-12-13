function get_grade(score)
{
    if(score >= 9900000) return "S"
    if(score >= 9800000) return "AAA+"
    if(score >= 9700000) return "AAA"
    if(score >= 9500000) return "AA+"
    if(score >= 9300000) return "AA"
    if(score >= 9000000) return "A+"
    if(score >= 8700000) return "A"
    if(score >= 7500000) return "B"
    if(score >= 6500000) return "C"

    return "D"
}

function get_lamp(lamp)
{
    switch(lamp)
    {
        case 5:
            return "perfect"
        case 4:
            return "full-combo"
        case 3:
            return "hard-clear"
        case 2:
            return "clear"
        default:
            return "played"
    }
}
