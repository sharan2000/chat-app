import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'shortUsernamePipe'
})
export class ShortUsernamePipe implements PipeTransform {
  transform(username: string, ...args: any[]) {
    let finalName = '@@'
    try {
      const names = username.split(" ")
      
      if(names.length > 1) {
        finalName = names[0][0] + names[1][0]
      } else {
        finalName = names[0].slice(0, 2)
      }
    } catch(err) {
      // initially empty username
    }
    return finalName.toUpperCase()
  }
}