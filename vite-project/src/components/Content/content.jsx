
const CoursePart = ({part})=>{
    return (
    <div>{part.name}  {part.exercises}</div>)
}


const Content = ({course}) => {
    const total =  course.parts.reduce((s, p) => s + p.exercises,0 )
    return (
        <>
        <h2>{course.name}</h2>
       {
        course.parts.map(part=>(
            <CoursePart key={part.exercises} part={part}></CoursePart>
        ))
       }
       <div>Total of {total} exercises</div>
        </>
      
    )
  }

  export default Content